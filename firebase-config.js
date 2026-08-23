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
  apiKey: "AIzaSyC4J6jW-teYK2cWskyOKjGw-jjQ_sWjfIg",
  authDomain: "juanil-relatorios.firebaseapp.com",
  projectId: "juanil-relatorios",
  storageBucket: "juanil-relatorios.firebasestorage.app",
  messagingSenderId: "276414986341",
  appId: "1:276414986341:web:58a6a28f89350d9f226e8c"
};

// Nome da coleção no Firestore onde os relatórios são gravados.
export const COLLECTION = "relatorios";

// Prefixo do número de protocolo gerado automaticamente.
// Formato final: REL-2026-0001
export const PROTOCOLO_PREFIXO = "REL";
