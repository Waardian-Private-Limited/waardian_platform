'use client';

import { useState, useEffect } from 'react';
import { X, PlusCircle, Check, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// API service for subscription plans
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PlanData {
  name: string;
  description: string;
  price_per_flat: number;
  discount_price: number;
  numberOfMonths: number;
  is_trial: boolean;
  modules: string[];
  trial_days?: number;
}

const subscriptionApi = {
  getPlans: async () => {
    const response = await axios.get(`${API_URL}/api/v1/subscription/plans`, {
      withCredentials: true
    });
    return response.data;
  },
  createPlan: async (planData: PlanData) => {
    const response = await axios.post(`${API_URL}/api/v1/subscription/plans`, planData, {
      withCredentials: true
    });
    return response.data;
  },
  updatePlan: async (id: number, planData: PlanData) => {
    const response = await axios.put(`${API_URL}/api/v1/subscription/plans/${id}`, planData, {
      withCredentials: true
    });
    return response.data;
  },
  deletePlan: async (id: number) => {
    const response = await axios.delete(`${API_URL}/api/v1/subscription/plans/${id}`, {
      withCredentials: true
    });
    return response.data;
  },
  togglePlanStatus: async (id: number, active: boolean) => {
    const response = await axios.patch(`${API_URL}/api/v1/subscription/plans/${id}/toggle`, { active }, {
      withCredentials: true
    });
    return response.data;
  }
};

type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  price_per_flat: number;
  discount_price: number;
  numberOfMonths: number;
  is_trial: boolean;
  trial_days: number;
  active: boolean;
  razorpay_plan_id: string | null;
  modules: string[];
  created_at: string;
  updated_at: string;
};

// Form Component
const SubscriptionForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlanData) => void;
  initialData: Partial<SubscriptionPlan>;
  isLoading: boolean;
}) => {
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [price, setPrice] = useState(initialData.price_per_flat || 0);
  const [discountPrice, setDiscountPrice] = useState(initialData.discount_price || 0);
  const [months, setMonths] = useState(initialData.numberOfMonths || 1);
  const [isTrial, setIsTrial] = useState(initialData.is_trial || false);
  const [trialDays, setTrialDays] = useState(0);
  const [modules, setModules] = useState(initialData.modules || []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setPrice(initialData.price_per_flat || 0);
      setDiscountPrice(initialData.discount_price || 0);
      setMonths(initialData.numberOfMonths || 1);
      setIsTrial(initialData.is_trial || false);
      setTrialDays(initialData.trial_days || 0);
      setModules(initialData.modules || []);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      price_per_flat: price,
      discount_price: discountPrice,
      numberOfMonths: months,
      is_trial: isTrial,
      trial_days: isTrial ? trialDays : undefined,
      modules: modules.length ? modules : ["all"], // Default to all modules if none selected
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-lg shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData.id ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className="text-sm text-gray-900 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter subscription name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-900 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Enter description"
              required
            />
          </div>

          {/* Price & Discount Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-900 block">Price Per Flat</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-900 block">Discount Price</label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter discount price"
              />
            </div>
          </div>

          {/* Months */}
          <div>
            <label className="text-sm text-gray-900 block">Number of Months</label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter months"
              required
            />
          </div>

          {/* Is Trial */}
          <div>
            <label className="flex items-center space-x-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => {
                  setIsTrial(e.target.checked);
                  if (!e.target.checked) setTrialDays(0); // clear trial days if unchecked
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span>Is Trial Plan?</span>
            </label>
          </div>

          {/* Trial Days (Only show if isTrial is true) */}
          {isTrial && (
            <div>
              <label className="text-sm text-gray-900 block">Trial Days</label>
              <input
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter number of trial days"
                required
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {isLoading ? 'Saving...' : initialData.id ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
export default function SuperAdminSubscription() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSubscriptionPlans = async () => {
    try {
      const data = await subscriptionApi.getPlans();
      setSubscriptions(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 
                          (err as any)?.response?.data?.message || 'Failed to fetch subscription plans';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const handleAdd = () => {
    setFormData({});
    setIsFormOpen(true);
  };

  const handleEdit = (subscription: SubscriptionPlan) => {
    setFormData(subscription);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    
    try {
      setIsLoading(true);
      await subscriptionApi.deletePlan(id);
      toast.success('Subscription plan deleted successfully');
      setSubscriptions(subscriptions.filter((s) => s.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 
                          (err as any)?.response?.data?.message || 'Failed to delete subscription plan';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      setIsLoading(true);
      await subscriptionApi.togglePlanStatus(id, !currentStatus);
      toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setSubscriptions(subscriptions.map(plan => 
        plan.id === id ? {...plan, active: !currentStatus} : plan
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 
                          (err as any)?.response?.data?.message || 'Failed to update plan status';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: PlanData) => {
    setIsLoading(true);
    try {
      if (formData.id) {
        const updated = await subscriptionApi.updatePlan(formData.id, data);
        toast.success('Subscription plan updated successfully');
        setSubscriptions(subscriptions.map((s) => (s.id === formData.id ? updated : s)));
      } else {
        const created = await subscriptionApi.createPlan(data);
        toast.success('Subscription plan created successfully');
        setSubscriptions([...subscriptions, created]);
      }
      setIsFormOpen(false);
      setFormData({});
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 
                          (err as any)?.response?.data?.message || 'Failed to save subscription plan';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-gray-50 min-h-[calc(100vh-8rem)] p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plan Management</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Plan
        </button>
      </div>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="bg-white rounded-lg shadow-sm p-4 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-600 border-b">
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Description</th>
              <th className="p-3">Price/Flat</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Months</th>
              <th className="p-3">Trial</th>
              <th className="p-3">Trial Days</th>
              <th className="p-3">Status</th>
              <th className="p-3">Razorpay ID</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-3 text-center text-gray-600">
                  No subscription plans found
                </td>
              </tr>
            ) : (
              subscriptions.map((plan) => (
                <tr key={plan.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{plan.id}</td>
                  <td className="p-3">{plan.name}</td>
                  <td className="p-3 max-w-[200px] truncate">{plan.description}</td>
                  <td className="p-3">₹{plan.price_per_flat}</td>
                  <td className="p-3">₹{plan.discount_price}</td>
                  <td className="p-3">{plan.numberOfMonths}</td>
                  <td className="p-3">{plan.is_trial ? 'Yes' : 'No'}</td>
                  <td className="p-3">{plan.trial_days || 0}</td>
                  <td className="p-3">
                    <button 
                      onClick={() => handleToggleStatus(plan.id, plan.active)}
                      className={`flex items-center ${plan.active ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {plan.active ? (
                        <>
                          <ToggleRight className="w-5 h-5 mr-1" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 mr-1" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="p-3">
                    {plan.razorpay_plan_id ? (
                      <span className="flex items-center text-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        <span className="truncate max-w-[100px]">{plan.razorpay_plan_id}</span>
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        <span>Not Set</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <SubscriptionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={formData}
        isLoading={isLoading}
      />
    </main>
  );
}