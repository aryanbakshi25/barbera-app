'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';

// TypeScript interfaces
interface Service {
  id: string;
  user_id: string;
  name: string;
  price: number;
  duration_minutes: number;
  created_at?: string;
  description?: string;
}

interface User {
  id: string;
  email?: string;
}

interface ServicesManagerProps {
  user: User;
  initialServices: Service[];
}

export default function ServicesManager({ user, initialServices }: ServicesManagerProps) {
  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // State management
  const [services, setServices] = useState<Service[]>(initialServices);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration_minutes: '',
    description: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewService(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!newService.name.trim() || !newService.price || !newService.duration_minutes) {
      alert('Please fill in all fields');
      return;
    }

    const price = parseFloat(newService.price);
    const duration = parseInt(newService.duration_minutes);

    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      alert('Please enter a valid duration');
      return;
    }

    setIsAdding(true);

    try {
      // Insert new service into Supabase
      const { data, error } = await supabase
        .from('services')
        .insert({
          user_id: user.id,
          name: newService.name.trim(),
          description: newService.description?.trim() || null,
          price: price,
          duration_minutes: duration
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      // Add new service to the local state
      setServices(prev => [...prev, data]);

      // Clear form
      setNewService({
        name: '',
        price: '',
        duration_minutes: '',
        description: '',
      });

    } catch (error) {
      console.error('Error adding service:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to add service';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      alert(`Failed to add service: ${errorMessage}`);
    } finally {
      setIsAdding(false);
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    setIsDeleting(serviceId);

    try {
      // Delete service from Supabase
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
        .eq('user_id', user.id); // Ensure user can only delete their own services

      if (error) {
        throw error;
      }

      // Remove service from local state
      setServices(prev => prev.filter(service => service.id !== serviceId));

    } catch (error) {
      console.error('Error deleting service:', error);
      alert(`Failed to delete service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-10" style={{ marginBottom: '60px', padding: '30px'}}>
      <h2 className="text-3xl font-bold text-white mb-8" style={{ marginBottom: '24px' }}>Services Management</h2>
      
      {/* Add New Service Form */}
      <div style={{ marginBottom: '50px' }}>
        <h3 className="text-xl font-semibold text-gray-300 mb-6" style={{ marginBottom: '24px' }}>Add New Service</h3>
        <form onSubmit={handleAddService}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" style={{ marginBottom: '32px' }}>
            <div>
              <label htmlFor="name" className="block text-base font-medium text-gray-300" style={{ marginBottom: '16px' }}>
                Service Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={newService.name}
                onChange={handleInputChange}
                className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
                placeholder="e.g. Haircut, Beard Trim..."
                disabled={isAdding}
                style={{paddingLeft: '1rem', lineHeight: '2.5'}}
                required
              />
            </div>
            
            <div>
              <label htmlFor="price" className="block text-base font-medium text-gray-300" style={{ marginBottom: '16px' }}>
                Price ($)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={newService.price}
                onChange={handleInputChange}
                className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
                placeholder="25.00"
                step="0.01"
                min="0"
                disabled={isAdding}
                style={{paddingLeft: '1rem', lineHeight: '2.5'}}
                required
              />
            </div>
            
            <div>
              <label htmlFor="duration_minutes" className="block text-base font-medium text-gray-300" style={{ marginBottom: '16px' }}>
                Duration (minutes)
              </label>
              <input
                type="number"
                id="duration_minutes"
                name="duration_minutes"
                value={newService.duration_minutes}
                onChange={handleInputChange}
                className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
                placeholder="30"
                min="1"
                disabled={isAdding}
                style={{paddingLeft: '1rem', lineHeight: '2.5'}}
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-base font-medium text-gray-300" style={{ marginBottom: '16px' }}>
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={newService.description}
              onChange={handleInputChange}
              className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base resize-none"
              placeholder="Describe the service (optional)"
              rows={3}
              disabled={isAdding}
              style={{paddingLeft: '1rem', lineHeight: '2.2', marginBottom: '15px'}}
            />
          </div>
          
          <button
            type="submit"
            disabled={isAdding}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg cursor-pointer"
            style={{lineHeight: 2.5}}
          >
            {isAdding ? 'Adding...' : 'Add Service'}
          </button>
        </form>
      </div>

      {/* Services List */}
      <div style={{ marginBottom: '50px' }}>
        <h3 className="text-xl font-semibold text-gray-300 mb-6" style={{ marginBottom: '24px' }}>
          Your Services ({services.length})
        </h3>
        
        {services.length === 0 ? (
          <p className="text-gray-400 text-center py-12 text-lg">No services added yet. Add your first service above.</p>
        ) : (
          <div className="flex flex-col gap-y-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between bg-gray-800/70 border border-gray-700 rounded-xl px-8 py-7 shadow-lg"
              >
                <div className="flex-1 pr-4">
                  <h4 className="text-white font-semibold text-lg mb-3" style={{letterSpacing: '0.01em', paddingTop: '15px', paddingLeft: '15px'}}>{service.name}</h4>
                  {service.description && (
                    <div className="text-gray-400 text-base mb-2" style={{paddingLeft: '15px', paddingBottom: '2px', whiteSpace: 'pre-line'}}>
                      {service.description}
                    </div>
                  )}
                  <div className="flex items-center space-x-4 text-base text-gray-300 mb-1" style={{paddingBottom: '10px', paddingLeft: '15px'}}>
                    <span className="font-medium text-blue-400">${service.price.toFixed(2)}</span>
                    <span>&nbsp;•&nbsp;</span>
                    <span className="text-gray-400">{service.duration_minutes} min</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  disabled={isDeleting === service.id}
                  className="ml-6 w-11 h-11 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-red-400" style={{marginRight: '10px'}}
                  aria-label="Delete"
                  title="Delete Service"
                >
                  {isDeleting === service.id ? (
                    <span className="text-white text-sm">...</span>
                  ) : (
                    <Image
                      src="/images/trash_icon.png"
                      alt="Delete"
                      width={22}
                      height={22}
                      className="opacity-90"
                      style={{ filter: 'invert(1)', cursor: 'pointer'}}
                    />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 