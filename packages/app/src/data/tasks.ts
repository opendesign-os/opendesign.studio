import { CircleCheck, CircleDot, Clock, TriangleAlert } from '@lucide/vue'

export type Priority = 'low' | 'medium' | 'high'

export type TaskStatus = 'todo' | 'overdue' | 'doing' | 'completed'

export type Person = {
  id: string
  name: string
  initial: string
  code: string
  tone: string
}

export type Task = {
  id: string
  title: string
  priority: Priority
  assignees: Person[]
  due: string
  subtasks: number
  comments: number
  status: TaskStatus
}

export const priorities = [
  { id: 'low', label: 'Low', tone: 'text-success' },
  { id: 'medium', label: 'Medium', tone: 'text-chart-4' },
  { id: 'high', label: 'High', tone: 'text-destructive' },
] as const satisfies readonly { id: Priority; label: string; tone: string }[]

export const columns = [
  { id: 'todo', label: 'To Do', icon: Clock, tone: 'text-muted-foreground', surface: 'bg-muted' },
  {
    id: 'overdue',
    label: 'Overdue',
    icon: TriangleAlert,
    tone: 'text-destructive',
    surface: 'bg-destructive/8',
  },
  { id: 'doing', label: 'Doing', icon: CircleDot, tone: 'text-chart-3', surface: 'bg-chart-3/8' },
  {
    id: 'completed',
    label: 'Completed',
    icon: CircleCheck,
    tone: 'text-success',
    surface: 'bg-success/8',
  },
] as const satisfies readonly { id: TaskStatus; label: string; [key: string]: unknown }[]

export const people: Person[] = [
  {
    id: 'taufik',
    name: 'Taufik Hidayat',
    initial: 'T',
    code: '#7712',
    tone: 'bg-chart-4/20 text-chart-4',
  },
  {
    id: 'yahyo',
    name: 'Yahyo Prayoga Dinata',
    initial: 'Y',
    code: '#7723',
    tone: 'bg-chart-2/20 text-chart-2',
  },
  {
    id: 'aditya',
    name: 'Aditya Irawan',
    initial: 'A',
    code: '#7734',
    tone: 'bg-chart-3/20 text-chart-3',
  },
  {
    id: 'rizky',
    name: 'Rizky Kurniawan',
    initial: 'R',
    code: '#7781',
    tone: 'bg-brand/20 text-brand',
  },
  {
    id: 'sophia',
    name: 'Sophia Bannett',
    initial: 'S',
    code: '#7756',
    tone: 'bg-success/20 text-success',
  },
  {
    id: 'amanda',
    name: 'Amanda Nur',
    initial: 'A',
    code: '#7768',
    tone: 'bg-chart-3/20 text-chart-3',
  },
]

function by(...ids: string[]) {
  return people.filter((person) => ids.includes(person.id))
}

export const tasks: Task[] = [
  {
    id: 'collaborative-planning-others',
    title: 'Collaborative Planning with Other Teachers',
    priority: 'high',
    assignees: by('taufik', 'amanda'),
    due: '12 Feb, 2025',
    subtasks: 2,
    comments: 0,
    status: 'todo',
  },
  {
    id: 'prepare-review-lesson-plans',
    title: 'Prepare & Review Lesson Plans',
    priority: 'medium',
    assignees: by('yahyo'),
    due: '12 Feb, 2025',
    subtasks: 0,
    comments: 3,
    status: 'todo',
  },
  {
    id: 'preparatory-material',
    title: 'Preparatory Material',
    priority: 'low',
    assignees: by('aditya', 'rizky', 'sophia'),
    due: '12 Feb, 2025',
    subtasks: 0,
    comments: 3,
    status: 'todo',
  },
  {
    id: 'collaborative-planning',
    title: 'Collaborative Planning',
    priority: 'medium',
    assignees: by('rizky'),
    due: '13 Feb, 2025',
    subtasks: 2,
    comments: 1,
    status: 'todo',
  },
  {
    id: 'classroom-documentation-overdue',
    title: 'Classroom Documentation',
    priority: 'medium',
    assignees: by('sophia'),
    due: '12 Feb, 2025',
    subtasks: 0,
    comments: 0,
    status: 'overdue',
  },
  {
    id: 'parent-progress-report',
    title: 'Parent Progress Report',
    priority: 'high',
    assignees: by('yahyo', 'taufik'),
    due: '08 Feb, 2025',
    subtasks: 3,
    comments: 2,
    status: 'overdue',
  },
  {
    id: 'classroom-documentation-doing',
    title: 'Classroom Documentation',
    priority: 'high',
    assignees: by('amanda'),
    due: '12 Feb, 2025',
    subtasks: 2,
    comments: 3,
    status: 'doing',
  },
  {
    id: 'assessment-feedback',
    title: 'Assessment & Feedback',
    priority: 'low',
    assignees: by('aditya'),
    due: '12 Feb, 2025',
    subtasks: 0,
    comments: 3,
    status: 'doing',
  },
  {
    id: 'student-wellbeing-monitoring',
    title: 'Student Well-being Monitoring',
    priority: 'medium',
    assignees: by('amanda'),
    due: '12 Feb, 2025',
    subtasks: 2,
    comments: 3,
    status: 'completed',
  },
  {
    id: 'grade-record-assessments',
    title: 'Grade & Record Assessments',
    priority: 'low',
    assignees: by('taufik'),
    due: '12 Feb, 2025',
    subtasks: 2,
    comments: 3,
    status: 'completed',
  },
  {
    id: 'prepare-review-lesson-plans-done',
    title: 'Prepare & Review Lesson Plans',
    priority: 'medium',
    assignees: by('amanda'),
    due: '12 Feb, 2025',
    subtasks: 2,
    comments: 3,
    status: 'completed',
  },
]
