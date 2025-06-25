import { sha256 } from "js-sha256";

// Gravatar API Key configurada
const GRAVATAR_API_KEY =
  "4691:gk-dGh1eZYP2WnY3scq1Bx9yQ6gOtLu0NvZkFRGu_lNNclTij0k8t4fltPfvbTw5";

/**
 * Teste direto do Gravatar com emails reais
 */
export async function testGravatar() {
  const testEmails = [
    "test@example.com",
    "admin@example.com",
    "user@gmail.com",
    "gustavolendimuth@gmail.com", // Email real do projeto
  ];

  console.log("🔍 Testing Gravatar service...");
  console.log("📋 API Key:", GRAVATAR_API_KEY ? "Configured" : "Missing");

  for (const email of testEmails) {
    const emailHash = sha256(email.toLowerCase().trim());

    // URL sem API key
    const basicUrl = `https://gravatar.com/avatar/${emailHash}?s=80&d=404`;

    // URL com API key
    const apiUrl = `${basicUrl}&api_key=${GRAVATAR_API_KEY}`;

    console.log(`\n👤 Testing email: ${email}`);
    console.log(`🔗 Hash: ${emailHash}`);
    console.log(`🌐 Basic URL: ${basicUrl}`);
    console.log(`🔑 API URL: ${apiUrl}`);

    try {
      // Teste com Image para verificar se carrega
      const testResult = await testImageLoad(apiUrl);

      console.log(`✅ Result: ${testResult ? "SUCCESS" : "FAILED"}`);

      if (testResult) {
        console.log(`🎉 Gravatar found for ${email}!`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${email}:`, error);
    }
  }
}

/**
 * Testa se uma imagem carrega com sucesso
 */
function testImageLoad(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Gera URL do Gravatar com SHA256 correto
 */
export function generateGravatarUrl(email: string, size: number = 80): string {
  const emailHash = sha256(email.toLowerCase().trim());
  let url = `https://gravatar.com/avatar/${emailHash}?s=${size}&d=identicon&r=pg`;

  if (GRAVATAR_API_KEY) {
    url += `&api_key=${GRAVATAR_API_KEY}`;
  }

  return url;
}

/**
 * Mostra exemplo de uso
 */
export function showGravatarExample() {
  const exampleEmail = "test@example.com";
  const gravatarUrl = generateGravatarUrl(exampleEmail);

  console.log("📝 Gravatar Example:");
  console.log(`Email: ${exampleEmail}`);
  console.log(`URL: ${gravatarUrl}`);
  console.log(`Hash: ${sha256(exampleEmail.toLowerCase().trim())}`);

  return gravatarUrl;
}
