'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/apiClient';

// Simple UI component replacements
const Input = ({ className = '', ...props }: any) => (
  <input className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`} {...props} />
);

const Label = ({ children, htmlFor, className = '' }: any) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>{children}</label>
);

const Textarea = ({ className = '', ...props }: any) => (
  <textarea className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${className}`} {...props} />
);

const Select = ({ children, value, onValueChange, ...props }: any) => (
  <select value={value} onChange={(e) => onValueChange?.(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" {...props}>
    {children}
  </select>
);

const SelectContent = ({ children }: any) => <>{children}</>;
const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
const SelectTrigger = ({ children }: any) => <>{children}</>;
const SelectValue = ({ placeholder }: any) => <option value="" disabled>{placeholder}</option>;

const Dialog = ({ open, onOpenChange, children }: any) => (
  open ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => onOpenChange?.(false)}>
      <div className="bg-white rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  ) : null
);

const DialogContent = ({ children, className = '' }: any) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const DialogHeader = ({ children }: any) => <div className="mb-4">{children}</div>;
const DialogTitle = ({ children }: any) => <h2 className="text-lg font-semibold">{children}</h2>;
const DialogTrigger = ({ children, asChild, ...props }: any) => (
  asChild ? children : <div {...props}>{children}</div>
);

const Table = ({ children, className = '' }: any) => (
  <div className="overflow-x-auto">
    <table className={`min-w-full divide-y divide-gray-200 ${className}`}>{children}</table>
  </div>
);

const TableHeader = ({ children }: any) => <thead className="bg-gray-50">{children}</thead>;
const TableBody = ({ children }: any) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
const TableRow = ({ children, className = '' }: any) => <tr className={className}>{children}</tr>;
const TableHead = ({ children, className = '' }: any) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>
);
const TableCell = ({ children, className = '' }: any) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>{children}</td>
);

const Switch = ({ checked, onCheckedChange, disabled = false }: any) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    onClick={() => !disabled && onCheckedChange?.(!checked)}
    disabled={disabled}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// import { toast } from 'sonner';

// Temporary toast implementation
const toast = {
  success: (message: string) => alert(`Success: ${message}`),
  error: (message: string) => alert(`Error: ${message}`)
};

interface AdPackage {
  id: number;
  name: string;
  description: string;
  base_price: number;
  duration_days: number;
  status: 'active' | 'inactive';
  notification_allowed: number;
  slot_waitage: number;
  created_at: string;
  updated_at: string;
}

interface AdPackageFormData {
  name: string;
  description: string;
  base_price: string;
  duration_days: string;
  status: 'active' | 'inactive';
  notification_allowed: string;
  slot_waitage: string;
}

const initialFormData: AdPackageFormData = {
  name: '',
  description: '',
  base_price: '',
  duration_days: '',
  status: 'active',
  notification_allowed: '0',
  slot_waitage: '1'
};

export default function AdPackages() {
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<AdPackage | null>(null);
  const [formData, setFormData] = useState<AdPackageFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      const data = await apiClient('/promotion/packages', {
        method: 'GET',
        params
      });

      setPackages(data.data.packages);
      setTotalPages(data.data.pagination.totalPages);
      setTotalCount(data.data.pagination.total);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to fetch ad packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [currentPage, searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPackage 
        ? `/promotion/packages/${editingPackage.id}`
        : '/promotion/packages';
      
      const method = editingPackage ? 'PUT' : 'POST';
      
      await apiClient(url, {
        method,
        body: {
          ...formData,
          base_price: parseFloat(formData.base_price),
          duration_days: parseInt(formData.duration_days),
          notification_allowed: parseInt(formData.notification_allowed),
          slot_waitage: parseInt(formData.slot_waitage)
        }
      });

      toast.success(`Ad package ${editingPackage ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
      setEditingPackage(null);
      setFormData(initialFormData);
      fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save ad package');
    }
  };

  const handleEdit = (pkg: AdPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      base_price: pkg.base_price.toString(),
      duration_days: pkg.duration_days.toString(),
      status: pkg.status,
      notification_allowed: pkg.notification_allowed.toString(),
      slot_waitage: pkg.slot_waitage.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad package?')) {
      return;
    }

    try {
      await apiClient(`/promotion/packages/${id}`, {
        method: 'DELETE'
      });

      toast.success('Ad package deleted successfully');
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete ad package');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await apiClient(`/promotion/packages/${id}/toggle-status`, {
        method: 'PATCH'
      });

      toast.success('Package status updated successfully');
      fetchPackages();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update package status');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPackage(null);
    setFormData(initialFormData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Packages</h1>
          <p className="text-gray-600">Manage advertisement packages and pricing</p>
        </div>
        <button
          onClick={() => {
            setFormData(initialFormData);
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? 'Edit Ad Package' : 'Create Ad Package'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_price">Base Price *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, base_price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration_days">Duration (Days) *</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    min="1"
                    value={formData.duration_days}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duration_days: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notification_allowed">Notifications Allowed</Label>
                  <Input
                    id="notification_allowed"
                    type="number"
                    min="0"
                    value={formData.notification_allowed}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notification_allowed: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="slot_waitage">Slot Weightage</Label>
                  <Input
                    id="slot_waitage"
                    type="number"
                    min="1"
                    value={formData.slot_waitage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, slot_waitage: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPackage ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Packages ({totalCount})</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search packages..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Notifications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pkg.name}</div>
                          {pkg.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {pkg.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${pkg.base_price}</TableCell>
                      <TableCell>{pkg.duration_days} days</TableCell>
                      <TableCell>{pkg.notification_allowed}</TableCell>
                      <TableCell>
                        <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                          {pkg.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(pkg.id)}
                          >
                            {pkg.status === 'active' ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(pkg)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(pkg.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}