"use client";
import { useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
}

export default function ClientServicesList({
  services: initialServices,
  isOwner,
}: {
  services: Service[];
  isOwner: boolean;
}) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const router = useRouter();

  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    
    setDeletingId(serviceToDelete.id);
    setShowDeleteModal(false);
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { error } = await supabase.from("services").delete().eq("id", serviceToDelete.id);
    
    if (!error) {
      console.log('Service deleted successfully');
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
    } else {
      console.error('Failed to delete service:', error);
      alert("Failed to delete service: " + error.message);
    }
    setDeletingId(null);
    setServiceToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  return (
    <div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {services.length === 0 && (
          <p style={{ color: "#bbb" }}>No services listed yet.</p>
        )}
        {services.map((service, index) => (
          <li
            key={service.id}
            style={{
              marginBottom: "1rem",
              borderBottom: index < services.length - 1 ? "1px solid #333" : "none",
              paddingBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{service.name}</div>
              <div style={{ color: "#aaa", fontSize: "0.95rem" }}>{service.description}</div>
              <div style={{ color: "#4A90E2", fontWeight: 500 }}>
                ${service.price} / {service.duration_minutes} min
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => handleDeleteClick(service)}
                disabled={deletingId === service.id}
                style={{
                  marginLeft: 16,
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#ef4444",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  opacity: deletingId === service.id ? 0.6 : 1,
                  flexShrink: 0,
                }}
                aria-label="Delete"
                title="Delete Service"
              >
                {deletingId === service.id ? (
                  <span style={{ color: "#fff" }}>...</span>
                ) : (
                  <Image
                    src="/images/trash_icon.png"
                    alt="Delete"
                    width={20}
                    height={20}
                    style={{ filter: "invert(1)" }}
                  />
                )}
              </button>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <button
          onClick={() => router.push("/account")}
          style={{
            marginTop: 24,
            background: "#4A90E2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.75rem 2rem",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px #0002",
          }}
        >
          Add More Services
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && serviceToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#232526',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 400,
            width: '90%',
            border: '1px solid #333',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}>
              Delete Service
            </h3>
            <p style={{
              color: '#bbb',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}>
              Are you sure you want to delete <strong style={{ color: '#fff' }}>{serviceToDelete.name}</strong>? 
              This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={handleDeleteCancel}
                style={{
                  background: 'transparent',
                  color: '#bbb',
                  border: '1px solid #555',
                  borderRadius: 6,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 