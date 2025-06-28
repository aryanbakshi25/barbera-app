"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert("Failed to delete service: " + error.message);
    }
    setDeletingId(null);
  };

  return (
    <div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {services.length === 0 && (
          <p style={{ color: "#bbb" }}>No services listed yet.</p>
        )}
        {services.map((service) => (
          <li
            key={service.id}
            style={{
              marginBottom: "1rem",
              borderBottom: "1px solid #333",
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
                onClick={() => handleDelete(service.id)}
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
    </div>
  );
} 