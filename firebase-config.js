// ============================================================
// RELATÓRIOS OPERACIONAIS — Juanil Transportes Rodoviários
// Configuração do Firebase (compartilhada por todas as páginas)
// ============================================================
//
// COMO CONFIGURAR:
// 1. Acesse https://console.firebase.google.com e crie um projeto
//    (ex.: "juanil-relatorios"), ou reutilize um projeto existente.
// 2. Ative: Firestore Database, Storage e Authentication
//    (método de login: E-mail/senha).
// 3. Em "Configurações do projeto" > "Seus apps" > Web (</>),
//    copie o objeto firebaseConfig e cole abaixo.
// 4. Storage: prefira plano Spark; se o console exigir Blaze, use com orçamento zero (uploads de fotos/vídeos).
// 5. Publique as regras de firestore.rules e storage.rules.
// 6. Crie os usuários em Authentication > Users com os e-mails
//    e senhas listados no README.
//
// ============================================================
export const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
};

// Nome da coleção no Firestore onde os relatórios são gravados.
export const COLLECTION = "relatorios";

// Prefixo do número de protocolo gerado automaticamente.
// Formato final: REL-2026-0001
export const PROTOCOLO_PREFIXO = "REL";
