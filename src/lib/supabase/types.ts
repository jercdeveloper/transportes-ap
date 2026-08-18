export type UserRole = "admin" | "chofer" | "padre";
export type TripStatus = "scheduled" | "active" | "completed";
export type TripEventType = "recogido" | "entregado";
export type PaymentStatus = "pendiente" | "pagado";
export type StudentDocumentType = "RC" | "TI" | "CC";
export type BloodType = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          document_id: string | null;
          phone_alt: string | null;
          license_number: string | null;
          license_category: string | null;
          license_expiry: string | null;
          notify_trip_start: boolean;
          notify_pickup_dropoff: boolean;
          notify_announcements: boolean;
          notify_payment_reminders: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          full_name: string;
          phone?: string | null;
          document_id?: string | null;
          phone_alt?: string | null;
          license_number?: string | null;
          license_category?: string | null;
          license_expiry?: string | null;
        };
        Update: Partial<{
          role: UserRole;
          full_name: string;
          phone: string | null;
          document_id: string | null;
          phone_alt: string | null;
          license_number: string | null;
          license_category: string | null;
          license_expiry: string | null;
          notify_trip_start: boolean;
          notify_pickup_dropoff: boolean;
          notify_announcements: boolean;
          notify_payment_reminders: boolean;
        }>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          parent_id: string;
          full_name: string;
          school_name: string | null;
          address_label: string | null;
          lat: number | null;
          lng: number | null;
          document_type: StudentDocumentType | null;
          document_id: string | null;
          birth_date: string | null;
          grade: string | null;
          blood_type: BloodType | null;
          medical_notes: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relation: string | null;
          default_fee: number | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          full_name: string;
          school_name?: string | null;
          address_label?: string | null;
          lat?: number | null;
          lng?: number | null;
          document_type?: StudentDocumentType | null;
          document_id?: string | null;
          birth_date?: string | null;
          grade?: string | null;
          blood_type?: BloodType | null;
          medical_notes?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          default_fee?: number | null;
          photo_url?: string | null;
        };
        Update: Partial<{
          parent_id: string;
          full_name: string;
          school_name: string | null;
          address_label: string | null;
          lat: number | null;
          lng: number | null;
          document_type: StudentDocumentType | null;
          document_id: string | null;
          birth_date: string | null;
          grade: string | null;
          blood_type: BloodType | null;
          medical_notes: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relation: string | null;
          default_fee: number | null;
          photo_url: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "students_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      authorized_pickup_persons: {
        Row: {
          id: string;
          student_id: string;
          full_name: string;
          phone: string | null;
          document_id: string | null;
          relation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          full_name: string;
          phone?: string | null;
          document_id?: string | null;
          relation?: string | null;
        };
        Update: Partial<{
          full_name: string;
          phone: string | null;
          document_id: string | null;
          relation: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "authorized_pickup_persons_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      routes: {
        Row: {
          id: string;
          name: string;
          driver_id: string | null;
          vehicle_plate: string | null;
          vehicle_model: string | null;
          vehicle_capacity: number | null;
          soat_expiry: string | null;
          tech_inspection_expiry: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          driver_id?: string | null;
          vehicle_plate?: string | null;
          vehicle_model?: string | null;
          vehicle_capacity?: number | null;
          soat_expiry?: string | null;
          tech_inspection_expiry?: string | null;
        };
        Update: Partial<{
          name: string;
          driver_id: string | null;
          vehicle_plate: string | null;
          vehicle_model: string | null;
          vehicle_capacity: number | null;
          soat_expiry: string | null;
          tech_inspection_expiry: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "routes_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      student_route_assignment: {
        Row: {
          id: string;
          student_id: string;
          route_id: string;
          stop_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          route_id: string;
          stop_order?: number;
        };
        Update: Partial<{
          student_id: string;
          route_id: string;
          stop_order: number;
        }>;
        Relationships: [
          {
            foreignKeyName: "student_route_assignment_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_route_assignment_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      trips: {
        Row: {
          id: string;
          route_id: string;
          trip_date: string;
          status: TripStatus;
          started_at: string | null;
          ended_at: string | null;
          checklist_tires: boolean;
          checklist_brakes: boolean;
          checklist_lights: boolean;
          checklist_seatbelts: boolean;
          checklist_notes: string | null;
        };
        Insert: {
          id?: string;
          route_id: string;
          trip_date?: string;
          status?: TripStatus;
          started_at?: string | null;
          ended_at?: string | null;
          checklist_tires?: boolean;
          checklist_brakes?: boolean;
          checklist_lights?: boolean;
          checklist_seatbelts?: boolean;
          checklist_notes?: string | null;
        };
        Update: Partial<{
          status: TripStatus;
          started_at: string | null;
          ended_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "trips_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_events: {
        Row: {
          id: string;
          trip_id: string;
          student_id: string;
          event_type: TripEventType;
          parent_confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          student_id: string;
          event_type: TripEventType;
        };
        Update: Partial<{
          event_type: TripEventType;
          parent_confirmed_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "trip_events_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_events_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          period: string;
          amount: number;
          status: PaymentStatus;
          paid_at: string | null;
          late_fee: number;
        };
        Insert: {
          id?: string;
          student_id: string;
          period: string;
          amount: number;
          status?: PaymentStatus;
          paid_at?: string | null;
          late_fee?: number;
        };
        Update: Partial<{
          status: PaymentStatus;
          paid_at: string | null;
          late_fee: number;
        }>;
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      absences: {
        Row: {
          id: string;
          student_id: string;
          absence_date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          absence_date: string;
          note?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "absences_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      incidents: {
        Row: {
          id: string;
          route_id: string;
          trip_id: string | null;
          student_id: string | null;
          reported_by: string | null;
          description: string;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          trip_id?: string | null;
          student_id?: string | null;
          reported_by?: string | null;
          description: string;
          photo_url?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "incidents_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incidents_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incidents_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance_records: {
        Row: {
          id: string;
          route_id: string;
          type: string;
          description: string | null;
          odometer_km: number | null;
          cost: number | null;
          performed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          type: string;
          description?: string | null;
          odometer_km?: number | null;
          cost?: number | null;
          performed_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "maintenance_records_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollment_requests: {
        Row: {
          id: string;
          parent_name: string;
          parent_phone: string;
          parent_email: string | null;
          student_name: string;
          school_name: string | null;
          grade: string | null;
          address_label: string | null;
          notes: string | null;
          status: "pendiente" | "contactado" | "descartado";
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_name: string;
          parent_phone: string;
          parent_email?: string | null;
          student_name: string;
          school_name?: string | null;
          grade?: string | null;
          address_label?: string | null;
          notes?: string | null;
        };
        Update: Partial<{
          status: "pendiente" | "contactado" | "descartado";
        }>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          route_id: string | null;
          title: string;
          body: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          route_id?: string | null;
          title: string;
          body: string;
          created_by?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "announcements_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          parent_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          sender_id: string;
          body: string;
        };
        Update: Partial<{
          read_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "messages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_name: string | null;
          action: string;
          entity_type: string;
          entity_label: string | null;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_name?: string | null;
          action: string;
          entity_type: string;
          entity_label?: string | null;
          details?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      emergency_alerts: {
        Row: {
          id: string;
          route_id: string;
          trip_id: string | null;
          driver_id: string | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          trip_id?: string | null;
          driver_id?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emergency_alerts_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      confirm_dropoff: {
        Args: { p_event_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
