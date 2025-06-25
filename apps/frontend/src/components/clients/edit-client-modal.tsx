"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
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
import { useUpdateClient } from "@/services/clients";
import { Client, UpdateClientDto } from "@/types/client";
import { ClientAddresses } from "./client-addresses";
import { Users } from "lucide-react";

interface EditClientModalProps {
  client: Client;
  trigger?: React.ReactNode;
}

export function EditClientModal({ client, trigger }: EditClientModalProps) {
  const [open, setOpen] = useState(false);
  const updateClient = useUpdateClient();
  const t = useTranslations("clients");

  const clientFormSchema = z.object({
    name: z.string().min(1, t("validationNameRequired")),
    email: z.string().email(t("validationInvalidEmail")),
    phone: z.string().min(1, t("validationPhoneRequired")),
    company: z.string().min(1, t("validationCompanyRequired")),
  });

  type ClientFormData = z.infer<typeof clientFormSchema>;

  console.log(
    "EditClientModal rendered for client:",
    client.company,
    "open:",
    open
  );

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: data as UpdateClientDto,
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to update client:", error);
    }
  };

  const handleTriggerClick = () => {
    console.log("Edit trigger clicked for client:", client.company);
    setOpen(true);
  };

  return (
    <>
      {trigger ? (
        <div onClick={handleTriggerClick} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button variant="outline" onClick={handleTriggerClick}>
          {t("editClient")}
        </Button>
      )}

      <FormModal
        open={open}
        onOpenChange={(newOpen) => {
          console.log("FormModal onOpenChange:", newOpen);
          setOpen(newOpen);
        }}
        title={t("editClient")}
        description={t("editClientFormSubtitle")}
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
                  <FormLabel>{t("company")}</FormLabel>
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
                  <FormLabel>{t("name")}</FormLabel>
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
                  <FormLabel>{t("email")}</FormLabel>
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
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl>
                    <PhoneInput {...field} placeholder="(11) 99999-9999" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ClientAddresses clientId={client.id} />
            <Button type="submit" className="w-full">
              {t("saveChanges")}
            </Button>
          </form>
        </Form>
      </FormModal>
    </>
  );
}
