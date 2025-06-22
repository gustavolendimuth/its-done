"use client";

import { Client } from "@/types/client";
import { useClientSpecificStats } from "@/services/client-stats";
import { FormModal } from "@/components/ui/form-modal";
import { useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  Clock,
  DollarSign,
  User,
  Edit2,
  Eye,
  Share2,
  Copy,
  MessageCircle,
  CheckCircle,
  Timer,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BigCard,
  BigCardStat,
  BigCardContactInfo,
} from "@/components/ui/big-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatHoursToHHMM } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { useUpdateClient, UpdateClientDto } from "@/services/clients";
import { ClientAddresses } from "./client-addresses";

const clientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().min(1, "Company is required"),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  const { data: stats, isLoading } = useClientSpecificStats(client.id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const updateClient = useUpdateClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
    },
  });

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/clients/${client.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Edit button clicked for client:", client.company);
    setIsEditModalOpen(true);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: data as UpdateClientDto,
      });
      setIsEditModalOpen(false);
      toast.success("Client updated successfully!");
    } catch (error) {
      console.error("Failed to update client:", error);
      toast.error("Failed to update client");
    }
  };

  const getClientDashboardUrl = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "";
    return `${baseUrl}/client-dashboard/${client.id}`;
  };

  const handleCopyLink = async () => {
    try {
      const url = getClientDashboardUrl();
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShareWhatsApp = () => {
    const url = getClientDashboardUrl();
    const message = `Hi! You can view your project dashboard and invoices here: ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareEmail = () => {
    const url = getClientDashboardUrl();
    const subject = `Your Project Dashboard - ${client.company}`;
    const body = `Hi,\n\nYou can view your project dashboard and invoices at the following link:\n\n${url}\n\nBest regards`;
    const emailUrl = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  // Prepare contact info
  const contactInfo: BigCardContactInfo[] = [
    { icon: User, value: client.name || "No contact name" },
    { icon: Mail, value: client.email },
    ...(client.phone ? [{ icon: Phone, value: client.phone }] : []),
  ];

  // Prepare stats
  const cardStats: BigCardStat[] = [
    {
      icon: Clock,
      label: "Hours",
      value: formatHoursToHHMM(stats?.totalHours ?? 0),
    },
    {
      icon: CheckCircle,
      label: "Paid",
      value: `$${(stats?.paidValue ?? 0).toFixed(2)}`,
    },
    {
      icon: Timer,
      label: "Pending",
      value: `$${(stats?.pendingValue ?? 0).toFixed(2)}`,
    },
  ];

  return (
    <div className="group transition-all duration-200 hover:scale-[1.02] space-y-0">
      <Card
        className={cn(
          "overflow-hidden relative hover:shadow-lg rounded-b-none",
          "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800"
        )}
      >
        {/* Accent bar */}
        <div className="h-2 bg-blue-500" />

        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold bg-blue-500">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold truncate">{client.company}</h3>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-2">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <info.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{info.value}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid gap-4 pt-4 border-t grid-cols-3">
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              cardStats.map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center"
                >
                  <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-sm font-bold">{stat.value}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Always Visible */}
      <div className="border border-t-0 rounded-t-none rounded-b-lg bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 group-hover:shadow-lg">
        <div className="p-3 border-t">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleViewClick}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleEditClick}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleShareClick}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Share Client Dashboard</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareWhatsApp}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Share via WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Send via Email</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Client"
        description="Update client information, contact details and manage addresses"
        icon={Users}
        className="sm:max-w-[600px]"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <PhoneInput {...field} placeholder="(11) 99999-9999" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ClientAddresses clientId={client.id} />
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </Form>
      </FormModal>
    </div>
  );
}
