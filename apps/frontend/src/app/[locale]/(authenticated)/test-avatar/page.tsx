"use client";

import { useSession } from "next-auth/react";
import { useAvatar } from "@/hooks/use-avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
// import { AvatarDiagnostics } from "@/components/ui/avatar-diagnostics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestAvatarPage() {
  const { data: session } = useSession();
  const { avatarUrl, fallbackUrls, initials, displayName, email } = useAvatar();

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Avatar System Test</h1>
        <p className="text-muted-foreground">
          Esta página testa o sistema de avatares e diagnósticos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current User Avatar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <UserAvatar
                src={avatarUrl}
                fallbackUrls={fallbackUrls}
                alt={displayName}
                fallbackText={initials}
                size="lg"
              />
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
                <Badge variant="outline" className="mt-1">
                  {initials}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fallback Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fallbackUrls.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {url.includes("googleusercontent")
                        ? "Google Profile"
                        : url.includes("gravatar.com")
                          ? "Gravatar"
                          : url.includes("ui-avatars.com")
                            ? "UI Avatars"
                            : url.includes("dicebear.com")
                              ? "DiceBear"
                              : url.startsWith("data:")
                                ? "Local SVG"
                                : "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {url.length > 50 ? `${url.substring(0, 50)}...` : url}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge variant={session ? "default" : "secondary"}>
                {session ? "Authenticated" : "Not Authenticated"}
              </Badge>
            </div>
            {session && (
              <>
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="text-sm">{session.user?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="text-sm">{session.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-sm">{session.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Has Image:</span>
                  <Badge
                    variant={session.user?.image ? "default" : "secondary"}
                  >
                    {session.user?.image ? "Yes" : "No"}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avatar Size Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="text-center space-y-2">
              <UserAvatar
                src={avatarUrl}
                fallbackUrls={fallbackUrls}
                alt={displayName}
                fallbackText={initials}
                size="sm"
              />
              <p className="text-xs">Small</p>
            </div>
            <div className="text-center space-y-2">
              <UserAvatar
                src={avatarUrl}
                fallbackUrls={fallbackUrls}
                alt={displayName}
                fallbackText={initials}
                size="md"
              />
              <p className="text-xs">Medium</p>
            </div>
            <div className="text-center space-y-2">
              <UserAvatar
                src={avatarUrl}
                fallbackUrls={fallbackUrls}
                alt={displayName}
                fallbackText={initials}
                size="lg"
              />
              <p className="text-xs">Large</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <AvatarDiagnostics /> */}

      <div className="text-center text-sm text-muted-foreground">
        <p>Esta página é apenas para testes e será removida em produção.</p>
        <p>
          O erro 404 do Gravatar é esperado quando o serviço está indisponível.
        </p>
      </div>
    </div>
  );
}
