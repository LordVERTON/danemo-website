"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Eye,
  DollarSign,
  Calendar,
  Activity,
  UserCheck,
  UserX,
  AlertCircle,
  X,
  Check
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCurrentUser } from "@/lib/use-current-user"

interface Employee {
  id: string
  user_id: string
  name: string
  email: string
  role: 'admin' | 'operator'
  salary: number
  position: string
  hire_date: string
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  auth_user?: {
    id: string
    email: string
    email_confirmed_at: string | null
    last_sign_in_at: string | null
    created_at: string
    user_metadata: any
  } | null
  last_sign_in_at?: string | null
  email_confirmed_at?: string | null
  created_at_auth?: string
}

interface EmployeeActivity {
  id: string
  employee_id: string
  activity_type: 'login' | 'logout' | 'order_created' | 'order_updated' | 'inventory_updated' | 'tracking_updated'
  description: string
  metadata: any
  created_at: string
}

export default function EmployeesPage() {
  const { user: currentUser } = useCurrentUser()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterActive, setFilterActive] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activities, setActivities] = useState<EmployeeActivity[]>([])

  // Formulaire pour ajouter/modifier un employé
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "operator" as "admin" | "operator",
    salary: "",
    position: "",
    hire_date: "",
    password: "",
    is_active: true
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    const handleQRScanResult = (event: CustomEvent) => {
      if (event.detail.type === 'employees') {
        setFormData(event.detail.data)
        setIsAddDialogOpen(true)
      }
    }

    window.addEventListener('qrScanResult', handleQRScanResult as EventListener)
    return () => window.removeEventListener('qrScanResult', handleQRScanResult as EventListener)
  }, [])

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/employees')
      const result = await response.json()
      
      if (result.success) {
        setEmployees(result.data)
      } else {
        setError('Erreur lors du chargement des collaborateurs')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmployeeActivities = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/activities`)
      const result = await response.json()
      
      if (result.success) {
        setActivities(result.data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salary: parseFloat(formData.salary),
          hire_date: formData.hire_date || new Date().toISOString().split('T')[0]
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setFormData({
          name: "",
          email: "",
          role: "operator",
          salary: "",
          position: "",
          hire_date: "",
          password: "",
          is_active: true
        })
        setIsAddDialogOpen(false)
        fetchEmployees()
      } else {
        setError(result.error || 'Erreur lors de l\'ajout du collaborateur')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const handleQRScan = (qrData: string) => {
    try {
      const data = JSON.parse(qrData)
      
      // Pré-remplir le formulaire avec les données du QR code
      setFormData({
        name: data.name || "",
        email: data.email || "",
        role: data.role || "operator",
        salary: data.salary || "",
        position: data.position || "",
        hire_date: data.hire_date || "",
        password: data.password || "",
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      
      // Ouvrir le dialog d'ajout
      setIsAddDialogOpen(true)
    } catch (error) {
      setError('Format de QR code invalide')
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      salary: employee.salary.toString(),
      position: employee.position,
      hire_date: employee.hire_date.split('T')[0],
      password: "",
      is_active: employee.is_active
    })
    setIsAddDialogOpen(true)
  }

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    try {
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salary: parseFloat(formData.salary)
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setEditingEmployee(null)
        setFormData({
          name: "",
          email: "",
          role: "operator",
          salary: "",
          position: "",
          hire_date: "",
          password: "",
          is_active: true
        })
        setIsAddDialogOpen(false)
        fetchEmployees()
        setError('') // Clear any previous errors
      } else {
        setError(result.error || 'Erreur lors de la modification du collaborateur')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      setError('Erreur de connexion lors de la modification')
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce collaborateur ?')) return

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        fetchEmployees()
      } else {
        setError(result.error || 'Erreur lors de la suppression du collaborateur')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsViewDialogOpen(true)
    fetchEmployeeActivities(employee.id)
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Administrateur", variant: "default" as const, color: "text-red-600" },
      operator: { label: "Opérateur", variant: "secondary" as const, color: "text-blue-600" },
    }
    const config = roleConfig[role as keyof typeof roleConfig]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getActivityIcon = (type: string) => {
    const icons = {
      login: UserCheck,
      logout: UserX,
      order_created: Plus,
      order_updated: Edit,
      inventory_updated: Edit,
      tracking_updated: Edit,
    }
    const Icon = icons[type as keyof typeof icons] || Activity
    return <Icon className="h-4 w-4" />
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || employee.role === filterRole
    const matchesActive = filterActive === "all" || 
      (filterActive === "active" && employee.is_active) ||
      (filterActive === "inactive" && !employee.is_active)
    return matchesSearch && matchesRole && matchesActive
  })

  if (isLoading) {
    return (
      <AdminLayout title="Gestion des employés">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>Chargement des collaborateurs...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Gestion des collaborateurs">
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Rechercher un collaborateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Ajouter un collaborateur</span>
                <span className="xs:hidden">Ajouter</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingEmployee ? "Modifier le collaborateur" : "Ajouter un collaborateur"}
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  {editingEmployee ? "Modifiez les informations du collaborateur" : "Ajoutez un nouveau collaborateur à l'équipe"}
                </DialogDescription>
                {currentUser && (
                  <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    Créé par : <span className="font-medium">{currentUser.name}</span>
                  </div>
                )}
              </DialogHeader>
              <form onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="role">Rôle *</Label>
                    <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                      <SelectTrigger className="text-base sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="operator">Opérateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="position">Poste *</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="salary">Salaire (€) *</Label>
                    <Input
                      id="salary"
                      type="number"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hire_date">Date d'embauche *</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                {!editingEmployee && (
                  <div>
                    <Label htmlFor="password">Mot de passe temporaire *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="L'employé devra le changer à la première connexion"
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="is_active" className="text-sm sm:text-base">Employé actif</Label>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t px-1 sm:px-0">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingEmployee(null)
                    setFormData({
                      name: "",
                      email: "",
                      role: "operator",
                      salary: "",
                      position: "",
                      hire_date: "",
                      password: "",
                      is_active: true
                    })
                  }} className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-1">
                    {editingEmployee ? "Modifier" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom, email ou poste..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="operator">Opérateur</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table des employés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborateurs ({filteredEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Version Desktop - Tableau */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Salaire</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{getRoleBadge(employee.role)}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>€{employee.salary.toLocaleString()}</TableCell>
                      <TableCell>
                        {employee.last_sign_in_at || employee.last_login
                          ? new Date(employee.last_sign_in_at || employee.last_login || '').toLocaleDateString('fr-FR')
                          : 'Jamais'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.is_active ? "default" : "secondary"}>
                          {employee.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEmployee(employee)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Version Mobile - Cartes */}
            <div className="lg:hidden space-y-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="p-4 hover:shadow-md transition-all duration-200">
                  <div className="space-y-3">
                    {/* Header avec nom et statut */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(employee.role)}
                        <Badge variant={employee.is_active ? "default" : "secondary"}>
                          {employee.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>

                    {/* Informations principales */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Poste:</span>
                        <p className="font-medium">{employee.position}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Salaire:</span>
                        <p className="font-medium">€{employee.salary.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Dernière connexion */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Dernière connexion:</span>
                      <p className="font-medium">
                        {employee.last_sign_in_at || employee.last_login
                          ? new Date(employee.last_sign_in_at || employee.last_login || '').toLocaleDateString('fr-FR')
                          : 'Jamais'
                        }
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEmployee(employee)}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Voir</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEmployee(employee)}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Supprimer</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de visualisation */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Détails du collaborateur</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-sm sm:text-base">Nom complet</Label>
                    <p className="font-medium text-base sm:text-sm">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm sm:text-base">Email</Label>
                    <p className="text-base sm:text-sm">{selectedEmployee.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-sm sm:text-base">Rôle</Label>
                    <div>{getRoleBadge(selectedEmployee.role)}</div>
                  </div>
                  <div>
                    <Label className="text-sm sm:text-base">Poste</Label>
                    <p>{selectedEmployee.position}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-sm sm:text-base">Salaire</Label>
                    <p className="font-medium text-base sm:text-sm">€{selectedEmployee.salary.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm sm:text-base">Date d'embauche</Label>
                    <p className="text-base sm:text-sm">{new Date(selectedEmployee.hire_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-sm sm:text-base">Dernière connexion</Label>
                    <p className="text-base sm:text-sm">{selectedEmployee.last_sign_in_at || selectedEmployee.last_login
                      ? new Date(selectedEmployee.last_sign_in_at || selectedEmployee.last_login || '').toLocaleString('fr-FR')
                      : 'Jamais'
                    }</p>
                  </div>
                  <div>
                    <Label className="text-sm sm:text-base">Statut</Label>
                    <Badge variant={selectedEmployee.is_active ? "default" : "secondary"}>
                      {selectedEmployee.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                
                {/* Informations Auth */}
                {selectedEmployee.auth_user && (
                  <div className="border-t pt-4">
                    <Label className="text-base sm:text-lg font-semibold">Informations de connexion</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-sm sm:text-base">ID Auth</Label>
                        <p className="text-xs sm:text-sm font-mono break-all">{selectedEmployee.auth_user.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm sm:text-base">Email confirmé</Label>
                        <p className="text-sm sm:text-base">{selectedEmployee.email_confirmed_at ? 'Oui' : 'Non'}</p>
                      </div>
                      <div>
                        <Label className="text-sm sm:text-base">Compte créé</Label>
                        <p className="text-sm sm:text-base">{selectedEmployee.created_at_auth 
                          ? new Date(selectedEmployee.created_at_auth).toLocaleDateString('fr-FR')
                          : 'N/A'
                        }</p>
                      </div>
                      <div>
                        <Label className="text-sm sm:text-base">Métadonnées</Label>
                        <p className="text-xs sm:text-sm break-all">{JSON.stringify(selectedEmployee.auth_user.user_metadata || {})}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Activités récentes */}
                <div>
                  <Label className="text-base sm:text-lg font-semibold">Activités récentes</Label>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        {getActivityIcon(activity.activity_type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.activity_type}
                        </Badge>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">Aucune activité récente</p>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t px-1 sm:px-0">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewDialogOpen(false)}
                    className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-1"
                  >
                    Fermer
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      handleEditEmployee(selectedEmployee)
                    }}
                    className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-1"
                  >
                    Modifier
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Message d'erreur */}
        {error && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  )
}
