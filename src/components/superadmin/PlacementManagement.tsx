'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Temporary toast implementation
const toast = {
  success: (message: string) => alert(`Success: ${message}`),
  error: (message: string) => alert(`Error: ${message}`)
};

interface AdPlacement {
  id: number;
  name: string;
  code: string;
  description: string;
  recommended_size: string;
  max_ads_allowed: number;
  price_of_slot: number;
  created_at: string;
  updated_at: string;
}

interface AdPlacementFormData {
  name: string;
  code: string;
  description: string;
  recommended_size: string;
  max_ads_allowed: string;
  price_of_slot: string;
}

const initialFormData: AdPlacementFormData = {
  name: '',
  code: '',
  description: '',
  recommended_size: '',
  max_ads_allowed: '1',
  price_of_slot: ''
};

export default function PlacementManagement() {
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<AdPlacement | null>(null);
  const [formData, setFormData] = useState<AdPlacementFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      };
      
      if (searchTerm) params.search = searchTerm;

      const data = await apiClient('/promotion/placements', {
        method: 'GET',
        params
      });

      setPlacements(data.data.placements);
      setTotalPages(data.data.pagination.totalPages);
      setTotalCount(data.data.pagination.total);
    } catch (error) {
      console.error('Error fetching placements:', error);
      toast.error('Failed to fetch ad placements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacements();
  }, [currentPage, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPlacement 
        ? `/promotion/placements/${editingPlacement.id}`
        : '/promotion/placements';
      
      const method = editingPlacement ? 'PUT' : 'POST';
      
      await apiClient(url, {
        method,
        body: {
          ...formData,
          max_ads_allowed: parseInt(formData.max_ads_allowed),
          price_of_slot: parseFloat(formData.price_of_slot)
        }
      });

      toast.success(`Ad placement ${editingPlacement ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
      setEditingPlacement(null);
      setFormData(initialFormData);
      fetchPlacements();
    } catch (error) {
      console.error('Error saving placement:', error);
      toast.error('Failed to save ad placement');
    }
  };

  const handleEdit = (placement: AdPlacement) => {
    setEditingPlacement(placement);
    setFormData({
      name: placement.name,
      code: placement.code,
      description: placement.description || '',
      recommended_size: placement.recommended_size || '',
      max_ads_allowed: placement.max_ads_allowed.toString(),
      price_of_slot: placement.price_of_slot.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad placement?')) {
      return;
    }

    try {
      await apiClient(`/promotion/placements/${id}`, {
        method: 'DELETE'
      });

      toast.success('Ad placement deleted successfully');
      fetchPlacements();
    } catch (error) {
      console.error('Error deleting placement:', error);
      toast.error('Failed to delete ad placement');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPlacement(null);
    setFormData(initialFormData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Management</h1>
          <p className="text-gray-600">Manage advertisement placement locations and pricing</p>
        </div>
        <button
          onClick={() => {
            setFormData(initialFormData);
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4" />
          Add Placement
        </button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPlacement ? 'Edit Ad Placement' : 'Create Ad Placement'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Placement Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Home Top Banner"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Placement Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., home_top"
                  pattern="[a-zA-Z0-9_-]+"
                  title="Only letters, numbers, underscores, and hyphens allowed"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details about this placement"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recommended_size">Recommended Size</Label>
                  <Input
                    id="recommended_size"
                    value={formData.recommended_size}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, recommended_size: e.target.value })}
                    placeholder="e.g., 728x90"
                  />
                </div>
                <div>
                  <Label htmlFor="max_ads_allowed">Max Ads Allowed *</Label>
                  <Input
                    id="max_ads_allowed"
                    type="number"
                    min="1"
                    value={formData.max_ads_allowed}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, max_ads_allowed: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="price_of_slot">Price per Day *</Label>
                <Input
                  id="price_of_slot"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_of_slot}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price_of_slot: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPlacement ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Placements ({totalCount})</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search placements..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
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
                    <TableHead>Code</TableHead>
                    <TableHead>Recommended Size</TableHead>
                    <TableHead>Max Ads</TableHead>
                    <TableHead>Price/Day</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placements.map((placement) => (
                    <TableRow key={placement.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{placement.name}</div>
                          {placement.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {placement.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {placement.code}
                        </code>
                      </TableCell>
                      <TableCell>{placement.recommended_size || '-'}</TableCell>
                      <TableCell>{placement.max_ads_allowed}</TableCell>
                      <TableCell>${placement.price_of_slot}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(placement)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(placement.id)}
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