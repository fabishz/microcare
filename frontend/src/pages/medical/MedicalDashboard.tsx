import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface PatientOverview {
    totalPatients: number;
    totalEntries: number;
    activePatients: number;
    averageEntriesPerPatient: string;
}

interface MoodDistribution {
    [mood: string]: number;
}

interface Analytics {
    moodDistribution: MoodDistribution;
    entriesOverTime: Array<{
        date: string;
        count: number;
    }>;
}

export default function MedicalDashboard() {
    const [overview, setOverview] = useState<PatientOverview | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const [overviewData, analyticsData] = await Promise.all([
                apiClient.get<PatientOverview>('/api/medical/overview'),
                apiClient.get<Analytics>('/api/medical/analytics'),
            ]);

            setOverview(overviewData);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const getMoodLabel = (mood: string): string => {
        const labels: { [key: string]: string } = {
            very_happy: 'Very Happy',
            happy: 'Happy',
            neutral: 'Neutral',
            sad: 'Sad',
            very_sad: 'Very Sad',
        };
        return labels[mood] || mood;
    };

    const getMoodEmoji = (mood: string): string => {
        const emojis: { [key: string]: string } = {
            very_happy: '😊',
            happy: '🙂',
            neutral: '😐',
            sad: '😔',
            very_sad: '😢',
        };
        return emojis[mood] || '😐';
    };

    const getMoodColor = (mood: string): string => {
        const colors: { [key: string]: string } = {
            very_happy: 'bg-green-500',
            happy: 'bg-blue-500',
            neutral: 'bg-gray-500',
            sad: 'bg-orange-500',
            very_sad: 'bg-red-500',
        };
        return colors[mood] || 'bg-gray-500';
    };

    if (isLoading || !overview || !analytics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading medical dashboard...</p>
                </div>
            </div>
        );
    }

    const totalMoodEntries = Object.values(analytics.moodDistribution).reduce((a, b) => a + b, 0);

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Medical Professional Dashboard</h1>
                <p className="text-muted-foreground mt-2">Monitor patient activity and mental health trends</p>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.totalPatients}</div>
                        <p className="text-xs text-muted-foreground">Registered users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.activePatients}</div>
                        <p className="text-xs text-muted-foreground">Active in last 7 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.totalEntries}</div>
                        <p className="text-xs text-muted-foreground">All journal entries</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Entries/Patient</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.averageEntriesPerPatient}</div>
                        <p className="text-xs text-muted-foreground">Per patient</p>
                    </CardContent>
                </Card>
            </div>

            {/* Mood Distribution */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Mood Distribution</CardTitle>
                    <CardDescription>Aggregated mood data across all patients</CardDescription>
                </CardHeader>
                <CardContent>
                    {totalMoodEntries === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No mood data available yet
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(analytics.moodDistribution)
                                .sort(([, a], [, b]) => b - a)
                                .map(([mood, count]) => {
                                    const percentage = ((count / totalMoodEntries) * 100).toFixed(1);
                                    return (
                                        <div key={mood} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{getMoodEmoji(mood)}</span>
                                                    <span className="font-medium">{getMoodLabel(mood)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">{count} entries</span>
                                                    <span className="font-medium">{percentage}%</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-secondary rounded-full h-2">
                                                <div
                                                    className={`${getMoodColor(mood)} h-2 rounded-full transition-all`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Journal entries over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                    {analytics.entriesOverTime.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No recent activity
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-end justify-between gap-2 h-48">
                                {analytics.entriesOverTime.slice(-14).map((entry, index) => {
                                    const maxCount = Math.max(...analytics.entriesOverTime.map(e => e.count));
                                    const height = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;

                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                            <div className="relative w-full">
                                                <div
                                                    className="bg-primary rounded-t transition-all hover:bg-primary/80 cursor-pointer"
                                                    style={{ height: `${height}%`, minHeight: entry.count > 0 ? '4px' : '0' }}
                                                    title={`${entry.count} entries on ${new Date(entry.date).toLocaleDateString()}`}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-4">
                                Last 14 days of activity
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
