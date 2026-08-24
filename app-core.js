// ============================================================
// RELATÓRIOS OPERACIONAIS — Juanil Transportes Rodoviários
// Núcleo: Firebase, autenticação, papéis e helpers.
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit as fsLimit, serverTimestamp, runTransaction,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

import { firebaseConfig, COLLECTION, PROTOCOLO_PREFIXO } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, fsLimit, serverTimestamp, runTransaction, arrayUnion,
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
};

export const RELATORIOS_COL = collection(db, COLLECTION);

// ---- Limites para caber no plano gratuito (Spark) do Firebase ----
// Fotos comprimidas no cliente (~150–350 KB cada). Vídeo curto.
export const MAX_FOTOS = 2;
export const MAX_FOTO_MB = 8;          // antes da compressão
export const MAX_VIDEO_SEGUNDOS = 20;
export const MAX_VIDEO_MB = 15;
export const FOTO_MAX_LADO = 1280;     // px no maior lado após compressão
export const FOTO_QUALIDADE = 0.68;    // JPEG

// ---- Papéis e nomes de exibição ----
// E-mails oficiais (criar exatamente assim no Firebase Auth)
export const ADMIN_EMAIL = "operacional@juanil.com.br";
export const DIRETORIA_EMAIL = "juanil@juanil.com.br";

// Lista única de Operações/CDs — usada nos formulários e filtros.
// Para adicionar um novo CD, basta incluir aqui.
export const OPERACOES = [
  "CD C&V", "CD TELE-RIO", "CD HORTIFRUTI", "CD LASA", "FROTA", "MANUTENÇÃO", "GERAL"
];

export function isAdmin(email) {
  return email === ADMIN_EMAIL;
}

export function isDiretoria(email) {
  return email === DIRETORIA_EMAIL;
}

/**
 * Carrega o perfil do usuário logado.
 * - Admin e Diretoria têm papel fixo (definido acima) e enxergam tudo.
 * - Demais usuários têm o CD/Operação atribuído pelo Admin em um documento
 *   na coleção "usuarios" do Firestore (doc ID = e-mail do usuário).
 *   Isso permite adicionar/trocar o CD de um usuário direto no Firebase
 *   Console, sem precisar editar código.
 */
export async function carregarPerfil(user) {
  if (!user) return { nome: "—", papel: "operacional", operacao: null };
  const email = user.email;

  if (isAdmin(email)) {
    return { nome: "OPERACIONAL (Admin)", papel: "admin", operacao: null };
  }
  if (isDiretoria(email)) {
    return { nome: "DIRETORIA", papel: "diretoria", operacao: null };
  }
  try {
    const snap = await getDoc(doc(db, "usuarios", email));
    if (snap.exists()) {
      const d = snap.data();
      return { nome: d.nome || email, papel: "operacional", operacao: d.operacao || null };
    }
  } catch (e) {
    console.warn("Não foi possível carregar o perfil do usuário:", e);
  }
  // Usuário autenticado mas ainda sem CD atribuído pelo Admin
  return { nome: email, papel: "operacional", operacao: null };
}

export function podeCriar(perfil) {
  if (!perfil) return false;
  if (perfil.papel === "diretoria") return false; // diretoria só fiscaliza
  if (perfil.papel === "admin") return true;
  return !!perfil.operacao; // operacional só cria se já tiver CD atribuído
}

export function podeEditar(relatorio, perfil, uid) {
  if (!perfil || !relatorio) return false;
  if (perfil.papel === "admin") return true;
  if (perfil.papel === "diretoria") return false; // diretoria não edita o conteúdo
  // Criador pode editar enquanto não estiver concluído
  return relatorio.criadoPorUid === uid && relatorio.status !== "concluido";
}

export function podeExcluir(relatorio, perfil, uid) {
  if (!perfil) return false;
  if (perfil.papel === "admin") return true;
  return relatorio.criadoPorUid === uid && relatorio.status !== "concluido";
}

export function podeCobrar(perfil) {
  return !!perfil && (perfil.papel === "diretoria" || perfil.papel === "admin");
}


/* ---------------- Autenticação ---------------- */
export function protegerPagina(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (!location.pathname.endsWith("login.html")) {
        location.href = "login.html";
      }
    } else {
      const perfil = await carregarPerfil(user);
      callback(user, perfil);
    }
  });
}

/* ---------------- Protocolo sequencial ---------------- */
export async function gerarProtocolo() {
  const ano = new Date().getFullYear();
  const contadorRef = doc(db, "contadores", String(ano));
  const numero = await runTransaction(db, async (tx) => {
    const snap = await tx.get(contadorRef);
    const atual = snap.exists() ? snap.data().ultimo || 0 : 0;
    const proximo = atual + 1;
    tx.set(contadorRef, { ultimo: proximo }, { merge: true });
    return proximo;
  });
  return `${PROTOCOLO_PREFIXO}-${ano}-${String(numero).padStart(4, "0")}`;
}

/* ---------------- Helpers ---------------- */
export function fmtData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function fmtDataHora(ts) {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

export function toast(msg, tipo = "") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = "toast show" + (tipo ? " " + tipo : "");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3200);
}

export function statusBadge(status) {
  const map = {
    aberto: ["badge-aberto", "Aberto"],
    andamento: ["badge-andamento", "Em andamento"],
    concluido: ["badge-concluido", "Concluído"],
    atrasado: ["badge-atrasado", "Atrasado"]
  };
  const [cls, label] = map[status] || map.aberto;
  return `<span class="badge ${cls}">${label}</span>`;
}

/* ---------------- Upload (fotos / vídeo) ---------------- */
// path: relatorios/{protocolo}/{categoria}/{timestamp}_{nome}
export function uploadAnexo(protocolo, categoria, file, onProgress) {
  return new Promise((resolve, reject) => {
    const safeName = (file.name || "arquivo").replace(/[^\w.\-]/g, "_");
    const path = `relatorios/${protocolo}/${categoria}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({
          nome: file.name,
          url,
          categoria,
          tamanho: file.size,
          path,
          tipo: file.type || ""
        });
      }
    );
  });
}


export async function removerAnexo(path) {
  try {
    await deleteObject(ref(storage, path));
  } catch (e) {
    console.warn("Falha ao remover arquivo do Storage:", e);
  }
}

/* ---------------- Duração de vídeo (cliente) ---------------- */
export function obterDuracaoVideo(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("video/")) {
      resolve(0);
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration || 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler o vídeo."));
    };
    video.src = url;
  });
}

/* ---------------- Preferência de dispositivo ---------------- */
export function salvarDispositivo(tipo) {
  try { localStorage.setItem("rel_dispositivo", tipo); } catch (_) {}
}

export function obterDispositivo() {
  try {
    return localStorage.getItem("rel_dispositivo") || "";
  } catch (_) {
    return "";
  }
}

export function aplicarClasseDispositivo() {
  const d = obterDispositivo();
  document.documentElement.classList.remove("device-mobile", "device-desktop");
  if (d === "mobile") document.documentElement.classList.add("device-mobile");
  if (d === "desktop") document.documentElement.classList.add("device-desktop");
}

/* ---------------- Geolocalização ---------------- */
export function obterGeolocalizacao(timeoutMs = 12000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ok: false, erro: "Geolocalização não suportada neste dispositivo." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precisao: pos.coords.accuracy,
          timestamp: pos.timestamp || Date.now()
        });
      },
      (err) => {
        resolve({
          ok: false,
          erro: err.message || "Não foi possível obter a localização.",
          codigo: err.code
        });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
    );
  });
}

export function fmtGeo(geo) {
  if (!geo || !geo.ok) return "Não registrada";
  return `${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)} (±${Math.round(geo.precisao || 0)} m)`;
}

/* ---------------- Assinatura (canvas) helpers ---------------- */
export function initSignaturePad(canvas) {
  const ctx = canvas.getContext("2d");
  let desenhando = false;
  let temTraço = false;

  function resize() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1c3d5e";
  }

  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    desenhando = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(e) {
    if (!desenhando) return;
    e.preventDefault();
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    temTraço = true;
  }

  function end(e) {
    if (e) e.preventDefault();
    desenhando = false;
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", end);
  canvas.addEventListener("mouseleave", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);
  canvas.addEventListener("touchcancel", end);

  resize();
  window.addEventListener("resize", () => {
    // não limpa o desenho em resize leve; só ajusta se necessário
  });

  return {
    limpar() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1c3d5e";
      temTraço = false;
    },
    temAssinatura() {
      return temTraço;
    },
    toDataURL() {
      return temTraço ? canvas.toDataURL("image/png") : null;
    }
  };
}

/**
 * Comprime imagem no cliente para reduzir custo de Storage/bandwidth.
 * Retorna um File JPEG redimensionado (maior lado <= FOTO_MAX_LADO).
 */
export function comprimirImagem(file, maxLado = FOTO_MAX_LADO, qualidade = FOTO_QUALIDADE) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const maior = Math.max(width, height);
      if (maior > maxLado) {
        const escala = maxLado / maior;
        width = Math.round(width * escala);
        height = Math.round(height * escala);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const nome = (file.name || "foto").replace(/\.\w+$/, "") + ".jpg";
          resolve(new File([blob], nome, { type: "image/jpeg", lastModified: Date.now() }));
        },
        "image/jpeg",
        qualidade
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}
