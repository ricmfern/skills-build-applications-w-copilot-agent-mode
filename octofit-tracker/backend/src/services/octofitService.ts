import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function focusForActivityType(type: string) {
  const normalizedType = type.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling'].includes(normalizedType)) return 'endurance';
  return normalizedType;
}

export async function listUsers() {
  return User.find().lean();
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' ||
    !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Valid user, team, type, and positive minutes are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user and team must exist'), { status: 400 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }

  const { name, mascot, members = [] } = input;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))
  ) {
    throw Object.assign(new Error('A team name, mascot, and valid member IDs are required'), { status: 400 });
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members,
  });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    { $unwind: { path: '$activities', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$_id',
        teamName: { $first: '$name' },
        totalPoints: { $sum: { $ifNull: ['$activities.points', 0] } },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
    { $project: { _id: 0, teamName: 1, totalPoints: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1, _id: -1 })
    .limit(5)
    .lean();
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  let focus = goalFocus;
  let workouts = await Workout.find({ focus }).sort({ title: 1 }).lean();

  if (workouts.length === 0 && recentActivities.length > 0) {
    focus = focusForActivityType(recentActivities[0].type);
    workouts = await Workout.find({ focus }).sort({ title: 1 }).lean();
  }

  const basedOnRecentActivity = recentActivities.length > 0 &&
    focusForActivityType(recentActivities[0].type) === focus;
  const reason = basedOnRecentActivity
    ? `Recommended based on your recent ${recentActivities[0].type} activity.`
    : `Recommended to support your ${user.fitnessGoal} fitness goal.`;
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
