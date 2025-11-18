import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Priority = 'low' | 'medium' | 'high';
type TaskStatus = 'todo' | 'inprogress' | 'done';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
}

interface Column {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

const priorityColors = {
  low: 'bg-secondary/20 text-secondary border-secondary/30',
  medium: 'bg-accent/20 text-accent border-accent/30',
  high: 'bg-destructive/20 text-destructive border-destructive/30'
};

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (!authToken || !userData) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        { id: '1', title: 'Настроить дизайн главной страницы', description: 'Создать макет в Figma', priority: 'high', status: 'todo', dueDate: '2025-01-20' },
        { id: '2', title: 'Написать документацию API', description: 'Описать все эндпоинты', priority: 'medium', status: 'todo' }
      ]
    },
    {
      id: 'inprogress',
      title: 'In Progress',
      tasks: [
        { id: '3', title: 'Разработка авторизации', description: 'JWT токены и OAuth', priority: 'high', status: 'inprogress', dueDate: '2025-01-18' }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        { id: '4', title: 'Настроить проект', description: 'Инициализация репозитория', priority: 'low', status: 'done' }
      ]
    }
  ]);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    status: 'todo' as TaskStatus,
    dueDate: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = columns
      .flatMap(col => col.tasks)
      .find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overColumnId = over.id as TaskStatus;

    const sourceColumn = columns.find(col => 
      col.tasks.some(task => task.id === activeTaskId)
    );
    
    if (!sourceColumn) return;

    const task = sourceColumn.tasks.find(t => t.id === activeTaskId);
    if (!task) return;

    if (sourceColumn.id !== overColumnId) {
      setColumns(prevColumns => {
        const newColumns = prevColumns.map(col => {
          if (col.id === sourceColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter(t => t.id !== activeTaskId)
            };
          }
          if (col.id === overColumnId) {
            return {
              ...col,
              tasks: [...col.tasks, { ...task, status: overColumnId }]
            };
          }
          return col;
        });
        return newColumns;
      });
    }
  };

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      ...newTask
    };

    setColumns(prevColumns => 
      prevColumns.map(col => 
        col.id === newTask.status 
          ? { ...col, tasks: [...col.tasks, task] }
          : col
      )
    );

    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: ''
    });
    setIsDialogOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Мои задачи</h1>
            <p className="text-muted-foreground">Управляй проектами эффективно</p>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user.full_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <Icon name="LogOut" size={16} className="mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div></div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                <Icon name="Plus" size={20} />
                Создать задачу
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Новая задача</DialogTitle>
                <DialogDescription>
                  Заполните информацию о задаче
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    placeholder="Введите название задачи"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    placeholder="Опишите задачу подробнее"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Приоритет</Label>
                    <Select value={newTask.priority} onValueChange={(value: Priority) => setNewTask({ ...newTask, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низкий</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="high">Высокий</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Статус</Label>
                    <Select value={newTask.status} onValueChange={(value: TaskStatus) => setNewTask({ ...newTask, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="inprogress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Срок выполнения</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleCreateTask}>
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <div key={column.id} className="animate-scale-in">
                <div className="bg-card rounded-xl shadow-lg p-6 min-h-[600px] border border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      {column.id === 'todo' && <Icon name="Circle" size={20} className="text-muted-foreground" />}
                      {column.id === 'inprogress' && <Icon name="Clock" size={20} className="text-secondary" />}
                      {column.id === 'done' && <Icon name="CheckCircle2" size={20} className="text-primary" />}
                      {column.title}
                    </h2>
                    <Badge variant="secondary" className="rounded-full">
                      {column.tasks.length}
                    </Badge>
                  </div>

                  <SortableContext items={[column.id]} strategy={verticalListSortingStrategy}>
                    <div
                      data-column-id={column.id}
                      className="space-y-3 min-h-[500px] p-2 rounded-lg transition-colors"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-primary/5');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-primary/5');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-primary/5');
                        const taskId = e.dataTransfer.getData('taskId');
                        if (taskId) {
                          handleDragEnd({
                            active: { id: taskId, data: { current: undefined } },
                            over: { id: column.id, data: { current: undefined } }
                          } as DragEndEvent);
                        }
                      }}
                    >
                      {column.tasks.map((task) => (
                        <Card
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('taskId', task.id);
                            handleDragStart({
                              active: { id: task.id, data: { current: undefined } }
                            } as DragStartEvent);
                          }}
                          className="p-4 cursor-move hover:shadow-md transition-all duration-200 border-l-4 border-l-primary group"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {task.title}
                              </h3>
                              <Badge className={priorityColors[task.priority]} variant="outline">
                                {task.priority === 'low' && 'Низкий'}
                                {task.priority === 'medium' && 'Средний'}
                                {task.priority === 'high' && 'Высокий'}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Icon name="Calendar" size={14} />
                                {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <Card className="p-4 cursor-move shadow-2xl rotate-3 scale-105 border-l-4 border-l-primary opacity-90">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {activeTask.title}
                    </h3>
                    <Badge className={priorityColors[activeTask.priority]} variant="outline">
                      {activeTask.priority === 'low' && 'Низкий'}
                      {activeTask.priority === 'medium' && 'Средний'}
                      {activeTask.priority === 'high' && 'Высокий'}
                    </Badge>
                  </div>
                  {activeTask.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activeTask.description}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default Index;