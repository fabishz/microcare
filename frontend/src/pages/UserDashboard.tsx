import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Calendar, PlusCircle } from 'lucide-react';
import SEO from '@/components/common/SEO';

interface DashboardStats {
    totalEntries: number;
    entriesThisWeek: number;
    currentStreak: number;
    averageMoodScore: number;
}

interface RecentEntry {
    id: string;
    title: string;
    mood: string | null;
    createdAt: string;
}

export default function UserDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalEntries: 0,
        entriesThisWeek: 0,
        currentStreak: 0,
        averageMoodScore: 0,
    });
    const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            // Fetch user's entries to calculate stats
            const entries = await apiClient.get<any>('/api/v1/entries');

            // Calculate stats from entries
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const entriesThisWeek = entries.data.filter((entry: any) =>
                new Date(entry.createdAt) >= oneWeekAgo
            ).length;

            setStats({
                totalEntries: entries.data.length,
                entriesThisWeek,
                currentStreak: calculateStreak(entries.data),
                averageMoodScore: calculateAverageMood(entries.data),
            });

            // Get recent entries (last 5)
            setRecentEntries(entries.data.slice(0, 5));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStreak = (entries: any[]): number => {
        if (entries.length === 0) return 0;

        // Sort entries by date (newest first)
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const entry of sortedEntries) {
            const entryDate = new Date(entry.createdAt);
            entryDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === streak) {
                streak++;
            } else if (daysDiff > streak) {
                break;
            }
        }

        return streak;
    };

    const calculateAverageMood = (entries: any[]): number => {
        const moodScores: { [key: string]: number } = {
            'very_happy': 5,
            'happy': 4,
            'neutral': 3,
            'sad': 2,
            'very_sad': 1,
        };

        const entriesWithMood = entries.filter(e => e.mood && moodScores[e.mood]);
        if (entriesWithMood.length === 0) return 0;

        const totalScore = entriesWithMood.reduce((sum, entry) =>
            sum + (moodScores[entry.mood] || 0), 0
        );

        return Math.round((totalScore / entriesWithMood.length) * 10) / 10;
    };

    const getMoodEmoji = (score: number): string => {
        if (score >= 4.5) return '😊';
        if (score >= 3.5) return '🙂';
        if (score >= 2.5) return '😐';
        if (score >= 1.5) return '😔';
        return '😢';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <SEO title="Dashboard" />
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
                <p className="text-muted-foreground mt-2">Here's your mental health journey overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEntries}</div>
                        <p className="text-xs text-muted-foreground">All time journal entries</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.entriesThisWeek}</div>
                        <p className="text-xs text-muted-foreground">Entries in the last 7 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.currentStreak} days</div>
                        <p className="text-xs text-muted-foreground">Keep it going!</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
                        <span className="text-2xl">{getMoodEmoji(stats.averageMoodScore)}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageMoodScore.toFixed(1)}/5</div>
                        <p className="text-xs text-muted-foreground">Overall mood score</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>What would you like to do today?</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Button onClick={() => navigate('/entries/new')} className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Write New Entry
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/entries')}>
                        View All Entries
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/profile')}>
                        Edit Profile
                    </Button>
                </CardContent>
            </Card>

            {/* Recent Entries */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Entries</CardTitle>
                    <CardDescription>Your latest journal entries</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentEntries.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No entries yet. Start your journey today!</p>
                            <Button onClick={() => navigate('/entries/new')}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Create Your First Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                                    onClick={() => navigate(`/entries/${entry.id}`)}
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium">{entry.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    {entry.mood && (
                                        <span className="text-2xl ml-4">
                                            {entry.mood === 'very_happy' && '😊'}
                                            {entry.mood === 'happy' && '🙂'}
                                            {entry.mood === 'neutral' && '😐'}
                                            {entry.mood === 'sad' && '😔'}
                                            {entry.mood === 'very_sad' && '😢'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
