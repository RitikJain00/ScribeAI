'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("token");
      
      // ❌ Not logged in
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          router.replace("/login");
          return;
        }

        setProfile(data.user);
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  // ⏳ Loading state
  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // ❌ profile null → maybe invalid token or no data
  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-red-500">Failed to load profile.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Manage your account details
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={profile?.name || ""}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ""}
              readOnly
              className="bg-muted"
            />
          </div>

          <Button disabled>
            Update Profile (Coming Soon)
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
