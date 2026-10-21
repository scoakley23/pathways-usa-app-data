import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag } from '@/components/pathways/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, TrendingUp, Users, CheckCircle, AlertCircle, Mail, Filter, Search, Send } from 'lucide-react';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { toast } from "sonner";

export default function TutorDashboard({ currentUserEmail, students }) {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');

  // Bulk Message State
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentUserEmail]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all assignments created by this tutor
      const allAssignments = await base44.entities.Assignment.filter(
        { tutor_email: currentUserEmail }, null, 500 // Fetch enough history
      );
      setAssignments(allAssignments);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate most common assignment type
    const typeCounts = assignments.reduce((acc, curr) => {
        acc[curr.content_type] = (acc[curr.content_type] || 0) + 1;
        return acc;
    }, {});
    const mostCommonType = Object.entries(typeCounts).sort((a,b) => b[1] - a[1])[0];

    // Active students (with at least one completed assignment in last 30 days)
    // Simplified: just use the passed students list for total active students
    const activeStudentCount = students.filter(s => s.status === 'active').length;

    return {
      totalAssignments: total,
      completedAssignments: completed,
      completionRate,
      mostCommonType: mostCommonType ? mostCommonType[0] : 'None',
      activeStudents: activeStudentCount
    };
  }, [assignments, students]);

  // Chart Data
  const chartData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i);
      return {
        date: format(d, 'MMM dd'),
        fullDate: startOfDay(d),
        assigned: 0,
        completed: 0
      };
    });

    assignments.forEach(a => {
      const assignedDate = startOfDay(new Date(a.assigned_date));
      const completedDate = a.completed_date ? startOfDay(new Date(a.completed_date)) : null;

      const assignedEntry = last14Days.find(d => d.fullDate.getTime() === assignedDate.getTime());
      if (assignedEntry) assignedEntry.assigned++;

      if (completedDate) {
        const completedEntry = last14Days.find(d => d.fullDate.getTime() === completedDate.getTime());
        if (completedEntry) completedEntry.completed++;
      }
    });

    return last14Days;
  }, [assignments]);

  // Filtered Assignments for Table
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const statusMatch = statusFilter === 'all' || a.status === statusFilter;
      const typeMatch = typeFilter === 'all' || a.content_type === typeFilter;
      const studentMatch = studentFilter === 'all' || a.student_email === studentFilter;
      return statusMatch && typeMatch && studentMatch;
    }).sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date));
  }, [assignments, statusFilter, typeFilter, studentFilter]);

  const handleBulkMessage = async () => {
    if (!messageSubject.trim() || !messageBody.trim()) {
      toast.error("Please fill in both subject and body");
      return;
    }

    setIsSending(true);
    try {
      const activeStudents = students.filter(s => s.status === 'active');
      
      if (activeStudents.length === 0) {
        toast.error("No active students to message");
        setIsSending(false);
        return;
      }

      // Send to each student
      // In a real production app, we might batch this or use a backend function loop
      // For now, we loop here
      const promises = activeStudents.map(student => 
        base44.integrations.Core.SendEmail({
          to: student.student_email,
          subject: messageSubject,
          body: messageBody
        })
      );

      await Promise.all(promises);
      
      toast.success(`Message sent to ${activeStudents.length} students`);
      setIsMessageDialogOpen(false);
      setMessageSubject('');
      setMessageBody('');
    } catch (error) {
      console.error("Bulk message failed", error);
      toast.error("Failed to send some messages");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-pw-navy" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <TrendingUp className="w-4 h-4" /> Refresh Data
          </Button>
      </div>
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="p-4 pb-1 md:p-5 md:pb-1">
            <CardTitle className="text-sm font-bold text-pw-muted">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-5 md:pt-0">
            <div className="text-2xl font-extrabold text-pw-navy">{metrics.completionRate}%</div>
            <p className="text-sm text-pw-muted">of assigned tasks completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-1 md:p-5 md:pb-1">
            <CardTitle className="text-sm font-bold text-pw-muted">Active Students</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-5 md:pt-0">
            <div className="text-2xl font-extrabold text-pw-navy">{metrics.activeStudents}</div>
            <p className="text-sm text-pw-muted">currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-1 md:p-5 md:pb-1">
            <CardTitle className="text-sm font-bold text-pw-muted">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-5 md:pt-0">
            <div className="text-2xl font-extrabold text-pw-navy">{metrics.totalAssignments}</div>
            <p className="text-sm text-pw-muted">tasks created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-1 md:p-5 md:pb-1">
            <CardTitle className="text-sm font-bold text-pw-muted">Common Topic</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-5 md:pt-0">
            <div className="text-xl font-extrabold text-pw-navy capitalize leading-tight">{metrics.mostCommonType.replace('_', ' ')}</div>
            <p className="text-sm text-pw-muted">most assigned type</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <TabsList className="grid grid-cols-2 w-full md:w-auto">
                <TabsTrigger value="overview" className="whitespace-normal text-center leading-tight">Overview & Trends</TabsTrigger>
                <TabsTrigger value="assignments" className="whitespace-normal text-center leading-tight">Assignments Management</TabsTrigger>
            </TabsList>
            <Button onClick={() => setIsMessageDialogOpen(true)} className="w-full md:w-auto">
                <Mail className="w-4 h-4" /> Bulk Message
            </Button>
        </div>

        <TabsContent value="overview" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Activity Trends (Last 14 Days)</CardTitle>
                    <CardDescription>Track when assignments are given vs. completed</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] px-2 md:px-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 16, left: -16, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DEE4EE" />
                            <XAxis dataKey="date" tick={{ fill: '#4A5A78', fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fill: '#4A5A78', fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: '1px solid #DEE4EE', boxShadow: '0 8px 24px rgba(20, 38, 74, 0.08)' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="assigned" name="Assigned" stroke="#14264A" strokeWidth={2} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="completed" name="Completed" stroke="#2E7D4F" strokeDasharray="6 3" strokeWidth={2} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <CardTitle className="text-lg">Assignment History</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                            <Select value={studentFilter} onValueChange={setStudentFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by Student" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Students</SelectItem>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.student_email}>{s.student_email}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="sentence">Sentence</SelectItem>
                                    <SelectItem value="vocabulary">Vocabulary</SelectItem>
                                    <SelectItem value="civics_question">Civics</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-2xl border border-pw-line overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Content Preview</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned</TableHead>
                                    <TableHead>Completed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssignments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-base text-pw-muted">
                                            No assignments found matching filters
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAssignments.map((assignment) => (
                                        <TableRow key={assignment.id}>
                                            <TableCell className="font-bold text-pw-navy">{assignment.student_email.split('@')[0]}</TableCell>
                                            <TableCell className="capitalize">{assignment.content_type.replace('_', ' ')}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-pw-muted">
                                                {assignment.custom_content || "Standard Content"}
                                            </TableCell>
                                            <TableCell>
                                                {assignment.status === 'completed' ? (
                                                    <Tag tone="green" className="whitespace-nowrap">Completed</Tag>
                                                ) : (
                                                    <Tag tone="blue" className="whitespace-nowrap">Pending</Tag>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-pw-muted whitespace-nowrap">
                                                {format(new Date(assignment.assigned_date), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-sm text-pw-muted whitespace-nowrap">
                                                {assignment.completed_date ? format(new Date(assignment.completed_date), 'MMM d, yyyy') : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Bulk Announcement</DialogTitle>
            <DialogDescription>
              Send a message to all {metrics.activeStudents} active students.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-pw-navy">Subject</label>
                <Input 
                    value={messageSubject} 
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="e.g. New Practice Materials Available" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-pw-navy">Message</label>
                <Input 
                    value={messageBody} 
                    onChange={(e) => setMessageBody(e.target.value)}
                    as="textarea"
                    className="h-32"
                    placeholder="Type your message here..." 
                />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkMessage} disabled={isSending}>
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}