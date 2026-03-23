import { useEffect, useState } from "react";
import "./app-shell.css";

const defaultApiBaseUrl = "https://reportapro-backend.onrender.com/api";
const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl
).replace(/\/$/, "");
const apiKey = (import.meta.env.VITE_API_KEY || "").trim();

const USERS_STORAGE_KEY = "reportapro_web_users_v1";
const SESSION_STORAGE_KEY = "reportapro_web_session_v1";
const BOSS_ID_STORAGE_KEY = "reportapro_web_boss_id";
const BOSS_PROFILE_STORAGE_KEY = "reportapro_web_boss_profile";
const maxEmployeesPerBoss = 5;

const emptyBossProfile = {
  id: null,
  name: "",
  companyName: "",
  accessCode: "",
  position: "",
  phone: "",
  email: "",
  notes: "",
};

const initialRegisterForm = {
  fullName: "",
  email: "",
  password: "",
  companyName: "",
  accessCode: "",
  position: "",
  role: "employee",
};

const initialEmployeeForm = {
  fullName: "",
  idNumber: "",
  phone: "",
  email: "",
  observations: "",
};

function sanitizeAccessCode(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 40);
}

function normalizeBossProfile(payload) {
  return {
    id: payload?.id ?? null,
    name: payload?.name ?? "",
    companyName: payload?.companyName ?? payload?.company_name ?? "",
    accessCode: payload?.accessCode ?? payload?.access_code ?? "",
    position: payload?.position ?? "",
    phone: payload?.phone ?? "",
    email: payload?.email ?? "",
    notes: payload?.notes ?? "",
  };
}

function parseStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildErrorMessage(payload, fallback) {
  if (
    payload &&
    typeof payload === "object" &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  return fallback;
}

async function apiRequest(path, options = {}) {
  if (!apiKey) {
    throw new Error(
      "Falta configurar VITE_API_KEY para proteger el acceso web.",
    );
  }

  const isFormData = options.body instanceof FormData;
  const headers = {
    "x-api-key": apiKey,
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(payload, `HTTP ${response.status}`));
  }

  return payload;
}

const api = {
  createBoss(profile) {
    return apiRequest("/bosses", {
      method: "POST",
      body: JSON.stringify({
        name: profile.name,
        companyName: profile.companyName,
        accessCode: profile.accessCode,
        position: profile.position,
        phone: profile.phone,
        email: profile.email,
        notes: profile.notes,
        plan: "FREE",
      }),
    });
  },
  updateBoss(bossId, profile) {
    return apiRequest(`/bosses/${bossId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: profile.name,
        companyName: profile.companyName,
        accessCode: profile.accessCode,
        position: profile.position,
        phone: profile.phone,
        email: profile.email,
        notes: profile.notes,
        plan: "FREE",
      }),
    });
  },
  getBoss(bossId) {
    return apiRequest(`/bosses/${bossId}`);
  },
  getBossByAccessCode(accessCode) {
    return apiRequest(`/bosses/by-access/${sanitizeAccessCode(accessCode)}`);
  },
  listEmployees(bossId) {
    return apiRequest(`/bosses/${bossId}/employees`);
  },
  upsertEmployee(bossId, employee) {
    return apiRequest(`/bosses/${bossId}/employees`, {
      method: "POST",
      body: JSON.stringify(employee),
    });
  },
  listReports(bossId) {
    return apiRequest(`/bosses/${bossId}/reports`);
  },
  createReport(payload) {
    return apiRequest("/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  uploadImages(files) {
    const form = new FormData();
    files.forEach((file) => {
      form.append("images", file);
    });

    return apiRequest("/uploads", {
      method: "POST",
      body: form,
    });
  },
};

export default function AppShell() {
  const [authMode, setAuthMode] = useState("login");
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    role: "",
  });
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [dataAuthorizationChecked, setDataAuthorizationChecked] =
    useState(false);
  const [bossProfile, setBossProfile] = useState(emptyBossProfile);
  const [bossId, setBossId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [reports, setReports] = useState([]);
  const [employeeForm, setEmployeeForm] = useState(initialEmployeeForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submittingEmployee, setSubmittingEmployee] = useState(false);

  useEffect(() => {
    const storedUsers = parseStoredJson(USERS_STORAGE_KEY, []);
    const storedSession = parseStoredJson(SESSION_STORAGE_KEY, null);
    const storedBossProfile = parseStoredJson(
      BOSS_PROFILE_STORAGE_KEY,
      emptyBossProfile,
    );
    const storedBossId =
      Number(localStorage.getItem(BOSS_ID_STORAGE_KEY) || 0) || null;

    setUsers(Array.isArray(storedUsers) ? storedUsers : []);
    setActiveUser(
      storedSession && typeof storedSession === "object" ? storedSession : null,
    );
    setBossProfile(normalizeBossProfile(storedBossProfile));
    setBossId(storedBossId);
    setUsersLoaded(true);
  }, []);

  useEffect(() => {
    if (!usersLoaded) {
      return;
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users, usersLoaded]);

  useEffect(() => {
    if (!usersLoaded) {
      return;
    }

    if (activeUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(activeUser));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [activeUser, usersLoaded]);

  useEffect(() => {
    if (!usersLoaded) {
      return;
    }

    if (bossId) {
      localStorage.setItem(BOSS_ID_STORAGE_KEY, String(bossId));
    } else {
      localStorage.removeItem(BOSS_ID_STORAGE_KEY);
    }
  }, [bossId, usersLoaded]);

  useEffect(() => {
    if (!usersLoaded) {
      return;
    }
    localStorage.setItem(BOSS_PROFILE_STORAGE_KEY, JSON.stringify(bossProfile));
  }, [bossProfile, usersLoaded]);

  useEffect(() => {
    if (!usersLoaded || !activeUser?.bossId) {
      return;
    }

    hydrateBossContext(activeUser.bossId).catch(() => undefined);
  }, [activeUser?.bossId, usersLoaded]);

  useEffect(() => {
    const previews = selectedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImagePreviews(previews);

    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [selectedFiles]);

  async function hydrateBossContext(selectedBossId) {
    setLoading(true);

    try {
      const [remoteProfile, remoteEmployees, remoteReports] = await Promise.all(
        [
          api.getBoss(selectedBossId),
          api.listEmployees(selectedBossId),
          api.listReports(selectedBossId),
        ],
      );

      setBossId(selectedBossId);
      setBossProfile(normalizeBossProfile(remoteProfile));
      setEmployees(Array.isArray(remoteEmployees) ? remoteEmployees : []);
      setReports(Array.isArray(remoteReports) ? remoteReports : []);
    } finally {
      setLoading(false);
    }
  }

  async function refreshRemoteData() {
    if (!bossId) {
      return;
    }

    await hydrateBossContext(bossId);
  }

  function showError(error, fallback) {
    setStatus({
      type: "error",
      message: error instanceof Error ? error.message : fallback,
    });
  }

  async function handleRegister(event) {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    const fullName = registerForm.fullName.trim();
    const email = registerForm.email.trim().toLowerCase();
    const password = registerForm.password;
    const companyName = registerForm.companyName.trim();
    const accessCode = sanitizeAccessCode(registerForm.accessCode);
    const position = registerForm.position.trim();
    const role = registerForm.role || "employee";

    if (
      !fullName ||
      !email ||
      password.length < 6 ||
      !dataAuthorizationChecked
    ) {
      setStatus({
        type: "error",
        message:
          "Completa datos basicos, clave minima de 6 caracteres y autorizacion de datos.",
      });
      return;
    }

    if (users.some((user) => user.email === email)) {
      setStatus({ type: "error", message: "Ese correo ya esta registrado." });
      return;
    }

    setLoading(true);

    try {
      let linkedBossId = null;
      let linkedCompany = "";

      if (role === "boss") {
        if (!companyName || accessCode.length < 4) {
          throw new Error(
            "Como jefe debes registrar empresa e ID de empresa valido.",
          );
        }

        const profile = {
          name: fullName,
          companyName,
          accessCode,
          position: position || "Jefe de equipo",
          phone: "",
          email,
          notes: "Cuenta creada desde la web React",
        };

        const result = await api.createBoss(profile);
        linkedBossId = result?.id ?? null;
        linkedCompany = companyName;
      } else {
        if (accessCode.length < 4) {
          throw new Error("Como empleado debes ingresar el ID de empresa.");
        }

        const bossData = await api.getBossByAccessCode(accessCode);
        linkedBossId = bossData?.id ?? null;
        linkedCompany = bossData?.company_name || bossData?.companyName || "";

        if (!linkedBossId) {
          throw new Error("No se pudo resolver la empresa vinculada.");
        }
      }

      setUsers((current) => [
        ...current,
        {
          fullName,
          email,
          password,
          role,
          bossId: linkedBossId,
          companyName: linkedCompany,
          dataAuthorized: true,
        },
      ]);
      setRegisterForm(initialRegisterForm);
      setDataAuthorizationChecked(false);
      setAuthMode("login");
      setLoginForm({ email, password: "", role });
      setStatus({
        type: "success",
        message: "Registro exitoso. Ahora inicia sesion.",
      });
    } catch (error) {
      showError(error, "No fue posible completar el registro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;
    const role = loginForm.role;

    if (!email || !password || !role) {
      setStatus({
        type: "error",
        message: "Completa correo, clave y rol para iniciar sesion.",
      });
      return;
    }

    const user = users.find(
      (item) =>
        item.email === email &&
        item.password === password &&
        item.role === role,
    );

    if (!user) {
      setStatus({ type: "error", message: "Credenciales o rol incorrectos." });
      return;
    }

    if (!user.bossId) {
      setStatus({
        type: "error",
        message: "La cuenta no tiene empresa vinculada. Registra de nuevo.",
      });
      return;
    }

    setLoading(true);

    try {
      await hydrateBossContext(user.bossId);
      setActiveUser(user);
      setStatus({ type: "success", message: `Bienvenido, ${user.fullName}.` });
    } catch (error) {
      showError(error, "No fue posible abrir la sesion.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setActiveUser(null);
    setBossId(null);
    setBossProfile(emptyBossProfile);
    setEmployees([]);
    setReports([]);
    setSelectedFiles([]);
    setImagePreviews([]);
    setEmployeeForm(initialEmployeeForm);
    setStatus({ type: "idle", message: "" });
  }

  async function handleSaveBossProfile(event) {
    event.preventDefault();

    const payload = {
      name: bossProfile.name.trim(),
      companyName: bossProfile.companyName.trim(),
      accessCode: sanitizeAccessCode(bossProfile.accessCode),
      position: bossProfile.position.trim(),
      phone: bossProfile.phone.trim(),
      email: bossProfile.email.trim(),
      notes: bossProfile.notes.trim(),
    };

    if (
      !payload.name ||
      !payload.companyName ||
      !payload.accessCode ||
      !payload.position
    ) {
      setStatus({
        type: "error",
        message:
          "Completa nombre, empresa, ID de empresa y cargo del responsable.",
      });
      return;
    }

    setLoading(true);

    try {
      let resolvedBossId = bossId;

      if (!resolvedBossId) {
        const result = await api.createBoss(payload);
        resolvedBossId = result?.id ?? null;
      } else {
        await api.updateBoss(resolvedBossId, payload);
      }

      if (!resolvedBossId) {
        throw new Error("No se pudo resolver el ID del jefe.");
      }

      await hydrateBossContext(resolvedBossId);
      setActiveUser((current) =>
        current
          ? {
              ...current,
              bossId: resolvedBossId,
              companyName: payload.companyName,
            }
          : current,
      );
      setStatus({
        type: "success",
        message: `Perfil sincronizado correctamente. Jefe ID: ${resolvedBossId}.`,
      });
    } catch (error) {
      showError(error, "No fue posible guardar el perfil del jefe.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmployeeSubmit(event) {
    event.preventDefault();

    if (!bossId) {
      setStatus({
        type: "error",
        message:
          "Primero debe existir un jefe registrado para sincronizar reportes.",
      });
      return;
    }

    const payload = {
      fullName: employeeForm.fullName.trim(),
      idNumber: employeeForm.idNumber.trim(),
      phone: employeeForm.phone.trim(),
      email: employeeForm.email.trim(),
      observations: employeeForm.observations.trim(),
    };

    if (
      !payload.fullName ||
      !payload.idNumber ||
      payload.observations.length < 3
    ) {
      setStatus({
        type: "error",
        message: "Completa nombre, identificación y observaciones del reporte.",
      });
      return;
    }

    setSubmittingEmployee(true);
    setStatus({ type: "idle", message: "" });

    try {
      const employeeResult = await api.upsertEmployee(bossId, {
        fullName: payload.fullName,
        idNumber: payload.idNumber,
        phone: payload.phone,
        email: payload.email,
      });

      const remoteEmployees = await api.listEmployees(bossId);
      setEmployees(Array.isArray(remoteEmployees) ? remoteEmployees : []);

      let resolvedEmployeeId = employeeResult?.id ?? null;
      if (!resolvedEmployeeId) {
        const matchedEmployee = (remoteEmployees || []).find(
          (item) => String(item.id_number || "") === payload.idNumber,
        );
        resolvedEmployeeId = matchedEmployee?.id ?? null;
      }

      if (!resolvedEmployeeId) {
        throw new Error("No se pudo identificar el empleado en base de datos.");
      }

      let imageUrls = [];
      if (selectedFiles.length) {
        const uploadResult = await api.uploadImages(selectedFiles);
        imageUrls = Array.isArray(uploadResult?.imageUrls)
          ? uploadResult.imageUrls
          : [];
      }

      await api.createReport({
        bossId,
        employeeId: resolvedEmployeeId,
        observations: payload.observations,
        imageUrls,
      });

      const remoteReports = await api.listReports(bossId);
      setReports(Array.isArray(remoteReports) ? remoteReports : []);
      setEmployeeForm(initialEmployeeForm);
      setSelectedFiles([]);
      setStatus({
        type: "success",
        message: "Reporte enviado y sincronizado correctamente.",
      });
    } catch (error) {
      showError(error, "No fue posible enviar el reporte del empleado.");
    } finally {
      setSubmittingEmployee(false);
    }
  }

  const isBoss = activeUser?.role === "boss";

  return (
    <div className="page-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />

      <header className="topbar">
        <div className="brand-lockup">
          <img
            className="brand-icon"
            src="/reportapro-icon.svg"
            alt="Icono de ReportaPro"
          />
          <div>
            <p className="eyebrow">
              Control diario de personal y reportes operativos
            </p>
            <h1>ReportaPro</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <a className="ghost-link" href="#principal">
            Ir al panel
          </a>
          {activeUser ? (
            <button className="ghost-link" type="button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          ) : null}
        </div>
      </header>

      <main className="layout" id="principal">
        {!usersLoaded ? (
          <LoadingState />
        ) : !activeUser ? (
          <AuthScreen
            authMode={authMode}
            loading={loading}
            loginForm={loginForm}
            registerForm={registerForm}
            dataAuthorizationChecked={dataAuthorizationChecked}
            status={status}
            bossProfile={bossProfile}
            onSwitchMode={setAuthMode}
            onLoginFieldChange={(field, value) =>
              setLoginForm((current) => ({ ...current, [field]: value }))
            }
            onRegisterFieldChange={(field, value) =>
              setRegisterForm((current) => ({ ...current, [field]: value }))
            }
            onAuthorizationChange={setDataAuthorizationChecked}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        ) : isBoss ? (
          <BossScreen
            activeUser={activeUser}
            bossId={bossId}
            bossProfile={bossProfile}
            employees={employees}
            reports={reports}
            loading={loading}
            status={status}
            onBossFieldChange={(field, value) =>
              setBossProfile((current) => ({ ...current, [field]: value }))
            }
            onRefresh={refreshRemoteData}
            onSaveProfile={handleSaveBossProfile}
          />
        ) : (
          <EmployeeScreen
            activeUser={activeUser}
            bossProfile={bossProfile}
            employees={employees}
            loading={loading}
            reports={reports}
            status={status}
            employeeForm={employeeForm}
            imagePreviews={imagePreviews}
            selectedCount={selectedFiles.length}
            submitting={submittingEmployee}
            onEmployeeFieldChange={(field, value) =>
              setEmployeeForm((current) => ({ ...current, [field]: value }))
            }
            onFilesChange={(files) => setSelectedFiles(Array.from(files || []))}
            onRefresh={refreshRemoteData}
            onSubmit={handleEmployeeSubmit}
          />
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="single-panel centered-panel glass-card compact-panel">
      <div className="loader" />
      <h2>Preparando tu espacio de trabajo</h2>
      <p>Sincronizando sesión local, branding y conexión con el backend.</p>
    </section>
  );
}

function AuthScreen({
  authMode,
  loading,
  loginForm,
  registerForm,
  dataAuthorizationChecked,
  status,
  bossProfile,
  onSwitchMode,
  onLoginFieldChange,
  onRegisterFieldChange,
  onAuthorizationChange,
  onLogin,
  onRegister,
}) {
  const highlights = [
    "Registro por rol con empresa vinculada y control de acceso.",
    "Sincronización directa con jefes, empleados, evidencias y reportes.",
    "Misma identidad visual para web React y experiencia móvil Flutter.",
  ];

  return (
    <>
      <section className="hero-panel auth-hero">
        <div className="hero-copy">
          <span className="badge">
            React web completo para supervisión operativa
          </span>
          <h2>
            Controla personal, reportes y evidencia desde una web más ágil.
          </h2>
          <p>
            ReportaPro ahora corre en React para la web con un flujo completo
            por rol: registro, inicio de sesión, panel del jefe, formulario del
            empleado, subida de fotos y muro de reportes.
          </p>
          <ul className="highlight-list">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <aside className="hero-card auth-card">
          <img
            className="hero-logo"
            src="/reportapro-horizontal.svg"
            alt="Logo horizontal de ReportaPro"
          />
          <p className="hero-kicker">Slogan principal</p>
          <h3>Reportes diarios claros. Equipos alineados. Evidencia lista.</h3>
          <p>
            Software para control de personal, seguimiento operativo y reportes
            de campo con una interfaz más predecible para Vercel y más ligera
            para navegador.
          </p>
          <div className="stat-grid two-cols">
            <article className="stat-card">
              <strong>2 roles</strong>
              <span>Jefe y empleado</span>
            </article>
            <article className="stat-card">
              <strong>{bossProfile.companyName || "1 flujo"}</strong>
              <span>Contexto local listo</span>
            </article>
          </div>
        </aside>
      </section>

      <section className="content-grid auth-grid">
        <article className="glass-card">
          <div className="tab-row">
            <button
              type="button"
              className={
                authMode === "login" ? "tab-button active" : "tab-button"
              }
              onClick={() => onSwitchMode("login")}
            >
              Inicio de sesion
            </button>
            <button
              type="button"
              className={
                authMode === "register" ? "tab-button active" : "tab-button"
              }
              onClick={() => onSwitchMode("register")}
            >
              Registro
            </button>
          </div>

          {authMode === "login" ? (
            <form className="stack-form" onSubmit={onLogin}>
              <SectionHeading
                eyebrow="Acceso por rol"
                title="Entrar como jefe o empleado"
                description="Selecciona el rol correcto para abrir el módulo correspondiente y cargar el contexto remoto de la empresa."
              />
              <label>
                Correo
                <input
                  autoComplete="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    onLoginFieldChange("email", event.target.value)
                  }
                />
              </label>
              <label>
                Clave
                <input
                  autoComplete="current-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    onLoginFieldChange("password", event.target.value)
                  }
                />
              </label>
              <label>
                Rol
                <select
                  value={loginForm.role}
                  onChange={(event) =>
                    onLoginFieldChange("role", event.target.value)
                  }
                >
                  <option value="">Selecciona un rol</option>
                  <option value="boss">Jefe</option>
                  <option value="employee">Empleado</option>
                </select>
              </label>
              <button
                className="primary-button"
                disabled={loading}
                type="submit"
              >
                {loading ? "Cargando..." : "Iniciar sesion"}
              </button>
            </form>
          ) : (
            <form className="stack-form" onSubmit={onRegister}>
              <SectionHeading
                eyebrow="Registro vinculado"
                title="Crear cuenta para jefe o empleado"
                description="Los jefes crean empresa e ID de acceso. Los empleados se vinculan con ese mismo ID para heredar el contexto correcto."
              />
              <label>
                Nombre completo
                <input
                  value={registerForm.fullName}
                  onChange={(event) =>
                    onRegisterFieldChange("fullName", event.target.value)
                  }
                />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    onRegisterFieldChange("email", event.target.value)
                  }
                />
              </label>
              <label>
                Clave
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) =>
                    onRegisterFieldChange("password", event.target.value)
                  }
                />
              </label>
              <label>
                Rol
                <select
                  value={registerForm.role}
                  onChange={(event) =>
                    onRegisterFieldChange("role", event.target.value)
                  }
                >
                  <option value="boss">Jefe</option>
                  <option value="employee">Empleado</option>
                </select>
              </label>
              {registerForm.role === "boss" ? (
                <>
                  <label>
                    Nombre de la empresa
                    <input
                      value={registerForm.companyName}
                      onChange={(event) =>
                        onRegisterFieldChange("companyName", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Cargo del jefe
                    <input
                      value={registerForm.position}
                      onChange={(event) =>
                        onRegisterFieldChange("position", event.target.value)
                      }
                    />
                  </label>
                </>
              ) : null}
              <label>
                {registerForm.role === "boss"
                  ? "ID de empresa"
                  : "ID de empresa entregado por tu jefe"}
                <input
                  value={registerForm.accessCode}
                  onChange={(event) =>
                    onRegisterFieldChange(
                      "accessCode",
                      sanitizeAccessCode(event.target.value),
                    )
                  }
                />
              </label>
              <label className="checkbox-row">
                <input
                  checked={dataAuthorizationChecked}
                  type="checkbox"
                  onChange={(event) =>
                    onAuthorizationChange(event.target.checked)
                  }
                />
                <span>
                  Autorizo el tratamiento de mis datos para operar la plataforma
                  y sincronizar reportes, evidencias y contexto de empresa.
                </span>
              </label>
              <button
                className="primary-button"
                disabled={loading}
                type="submit"
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>
          )}

          <StatusBanner status={status} />
        </article>

        <article className="glass-card info-stack">
          <SectionHeading
            eyebrow="Contexto actual"
            title="Puntos clave del onboarding"
            description="La capa web ya replica el flujo funcional de Flutter: alta local, vínculo con jefe y consumo del mismo backend productivo."
          />
          <QuoteCard
            label="Mensaje SEO"
            text="Software para control de personal, supervisión operativa y reportes diarios con evidencias en campo."
          />
          <QuoteCard
            label="Subtitulo comercial"
            text="Supervisa equipos, documenta novedades y ordena la operación diaria con una experiencia más clara para web y móvil."
          />
          <InfoCard
            title="Empresa detectada"
            message={
              bossProfile.companyName ||
              "Todavía no hay una empresa activa en el contexto local."
            }
          />
        </article>
      </section>
    </>
  );
}

function BossScreen({
  activeUser,
  bossId,
  bossProfile,
  employees,
  reports,
  loading,
  status,
  onBossFieldChange,
  onRefresh,
  onSaveProfile,
}) {
  const employeeCount = employees.length;
  const limitReached = employeeCount >= maxEmployeesPerBoss;

  return (
    <>
      <section className="hero-panel module-hero">
        <div className="hero-copy compact-copy">
          <span className="badge">Vista jefe</span>
          <h2>Coordina tu equipo y revisa evidencia del día.</h2>
          <p>
            {bossProfile.companyName
              ? `Empresa activa: ${bossProfile.companyName}. Este panel centraliza empleados, canales directos y reportes diarios en una sola lectura.`
              : "Configura empresa, ID de acceso y contacto para dejar listo el módulo operativo del equipo."}
          </p>
          <div className="stat-grid three-cols mobile-stack">
            <article className="stat-card">
              <strong>
                {employeeCount}/{maxEmployeesPerBoss}
              </strong>
              <span>Empleados activos</span>
            </article>
            <article className="stat-card">
              <strong>{reports.length}</strong>
              <span>Reportes cargados</span>
            </article>
            <article className="stat-card">
              <strong>{bossProfile.phone ? "Listo" : "Pendiente"}</strong>
              <span>Canal directo</span>
            </article>
          </div>
        </div>

        <aside className="hero-card module-card">
          <p className="hero-kicker">Sesión actual</p>
          <h3>{activeUser.fullName}</h3>
          <p>Jefe vinculado al backend con ID {bossId || "pendiente"}.</p>
          <div className="action-stack">
            <button
              className="secondary-button"
              type="button"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? "Refrescando..." : "Refrescar datos remotos"}
            </button>
            {bossProfile.phone ? (
              <a
                className="primary-button"
                href={`https://wa.me/${bossProfile.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir WhatsApp
              </a>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="dashboard-grid boss-grid">
        <article className="glass-card">
          <form className="stack-form" onSubmit={onSaveProfile}>
            <SectionHeading
              eyebrow="Perfil del jefe"
              title="Datos clave de empresa y acceso"
              description="Mantén nombre visible, ID de empresa, canales de contacto y notas operativas listos para el equipo."
            />
            <div className="two-column-grid">
              <label>
                Nombre del jefe
                <input
                  value={bossProfile.name}
                  onChange={(event) =>
                    onBossFieldChange("name", event.target.value)
                  }
                />
              </label>
              <label>
                Empresa
                <input
                  value={bossProfile.companyName}
                  onChange={(event) =>
                    onBossFieldChange("companyName", event.target.value)
                  }
                />
              </label>
              <label>
                ID de empresa
                <input
                  value={bossProfile.accessCode}
                  onChange={(event) =>
                    onBossFieldChange(
                      "accessCode",
                      sanitizeAccessCode(event.target.value),
                    )
                  }
                />
              </label>
              <label>
                Cargo
                <input
                  value={bossProfile.position}
                  onChange={(event) =>
                    onBossFieldChange("position", event.target.value)
                  }
                />
              </label>
              <label>
                WhatsApp
                <input
                  value={bossProfile.phone}
                  onChange={(event) =>
                    onBossFieldChange("phone", event.target.value)
                  }
                />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  value={bossProfile.email}
                  onChange={(event) =>
                    onBossFieldChange("email", event.target.value)
                  }
                />
              </label>
            </div>
            <label>
              Notas operativas
              <textarea
                rows="4"
                value={bossProfile.notes}
                onChange={(event) =>
                  onBossFieldChange("notes", event.target.value)
                }
              />
            </label>
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Guardando..." : "Guardar perfil del jefe"}
            </button>
          </form>
          <StatusBanner status={status} />
        </article>

        <article className="glass-card">
          <SectionHeading
            eyebrow="Capacidad del plan"
            title="Límite operativo actual"
            description="El plan FREE permite hasta cinco empleados vinculados por jefe en este flujo actual."
          />
          <ProgressPanel
            current={employeeCount}
            limit={maxEmployeesPerBoss}
            alert={limitReached}
          />
          <InfoCard
            title={limitReached ? "Límite alcanzado" : "Todavía hay capacidad"}
            message={
              limitReached
                ? "Llegaste al límite de cinco empleados. Para ampliar el equipo toca cambiar de plan."
                : "Aún puedes seguir registrando empleados y recibir sus reportes diarios."
            }
          />
        </article>

        <article className="glass-card wide-panel">
          <SectionHeading
            eyebrow="Equipo registrado"
            title="Empleados vinculados al jefe"
            description="Cada empleado queda asociado por empresa y aparece aquí con sus datos principales."
          />
          {employees.length ? (
            <div className="list-stack">
              {employees.map((employee) => (
                <article
                  className="list-card"
                  key={`${employee.id}-${employee.id_number}`}
                >
                  <div className="avatar-pill">
                    {String(employee.full_name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <strong>{employee.full_name}</strong>
                    <p>
                      ID: {employee.id_number} · Tel:{" "}
                      {employee.phone || "Sin dato"} ·{" "}
                      {employee.email || "Sin correo"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin empleados todavía"
              message="Cuando un empleado envíe su primer reporte, quedará visible aquí con sus datos principales."
            />
          )}
        </article>

        <article className="glass-card wide-panel">
          <SectionHeading
            eyebrow="Muro de reportes"
            title="Evidencia del día"
            description="Observaciones, fecha y fotografías subidas por empleados dentro de la misma empresa."
          />
          {reports.length ? (
            <div className="report-grid">
              {reports.map((report) => (
                <article className="report-card" key={report.id}>
                  {report.images?.[0] ? (
                    <img
                      src={report.images[0]}
                      alt={`Evidencia de ${report.employee_name}`}
                    />
                  ) : (
                    <div className="report-image empty">Sin foto</div>
                  )}
                  <div className="report-copy">
                    <strong>
                      {report.employee_name} ({report.employee_id})
                    </strong>
                    <span>{formatDate(report.created_at)}</span>
                    <p>{report.observations}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin reportes aún"
              message="Cuando los empleados suban observaciones y evidencia, aparecerán aquí en orden cronológico."
            />
          )}
        </article>
      </section>
    </>
  );
}

function EmployeeScreen({
  activeUser,
  bossProfile,
  employees,
  loading,
  reports,
  status,
  employeeForm,
  imagePreviews,
  selectedCount,
  submitting,
  onEmployeeFieldChange,
  onFilesChange,
  onRefresh,
  onSubmit,
}) {
  return (
    <>
      <section className="hero-panel module-hero">
        <div className="hero-copy compact-copy">
          <span className="badge">Vista empleado</span>
          <h2>Carga tu avance diario en pocos pasos.</h2>
          <p>
            {bossProfile.companyName
              ? `Empresa vinculada: ${bossProfile.companyName}. El flujo deja listo nombre, identificación, observaciones y evidencia en una sola entrega.`
              : "La empresa se define desde el módulo del jefe para completar el contexto operativo."}
          </p>
          <div className="stat-grid three-cols mobile-stack">
            <article className="stat-card">
              <strong>
                {bossProfile.companyName ? "Vinculada" : "Pendiente"}
              </strong>
              <span>Empresa</span>
            </article>
            <article className="stat-card">
              <strong>{selectedCount}</strong>
              <span>Fotos cargadas</span>
            </article>
            <article className="stat-card">
              <strong>{loading ? "En curso" : "Disponible"}</strong>
              <span>Sincronización</span>
            </article>
          </div>
        </div>

        <aside className="hero-card module-card">
          <p className="hero-kicker">Sesión actual</p>
          <h3>{activeUser.fullName}</h3>
          <p>
            {bossProfile.companyName
              ? `Trabajando bajo ${bossProfile.companyName}.`
              : "Todavía no hay empresa activa en el contexto local."}
          </p>
          <button
            className="secondary-button"
            type="button"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? "Refrescando..." : "Refrescar datos remotos"}
          </button>
        </aside>
      </section>

      <section className="dashboard-grid employee-grid">
        <article className="glass-card wide-panel">
          <form className="stack-form" onSubmit={onSubmit}>
            <SectionHeading
              eyebrow="Formulario de empleado"
              title="Enviar reporte con evidencia"
              description="El empleado actualiza sus datos básicos, deja observaciones del día y adjunta fotografías en un solo envío."
            />
            <InfoCard
              title="Contexto actual"
              message={
                bossProfile.companyName
                  ? `Empresa asignada: ${bossProfile.companyName}. Registros activos para el jefe: ${employees.length}/${maxEmployeesPerBoss}.`
                  : "Primero debe existir un jefe registrado para completar la sincronización remota."
              }
            />
            <div className="two-column-grid">
              <label>
                Nombre completo
                <input
                  value={employeeForm.fullName}
                  onChange={(event) =>
                    onEmployeeFieldChange("fullName", event.target.value)
                  }
                />
              </label>
              <label>
                Documento o ID
                <input
                  value={employeeForm.idNumber}
                  onChange={(event) =>
                    onEmployeeFieldChange("idNumber", event.target.value)
                  }
                />
              </label>
              <label>
                Teléfono
                <input
                  value={employeeForm.phone}
                  onChange={(event) =>
                    onEmployeeFieldChange("phone", event.target.value)
                  }
                />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(event) =>
                    onEmployeeFieldChange("email", event.target.value)
                  }
                />
              </label>
            </div>
            <label>
              Observaciones del día
              <textarea
                rows="5"
                value={employeeForm.observations}
                onChange={(event) =>
                  onEmployeeFieldChange("observations", event.target.value)
                }
              />
            </label>
            <label className="file-dropzone">
              <span>Adjuntar imágenes</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => onFilesChange(event.target.files)}
              />
              <small>
                Hasta 5 imágenes por envío. Usa fotos claras del avance o
                evidencia.
              </small>
            </label>

            {imagePreviews.length ? (
              <div className="preview-grid">
                {imagePreviews.map((item) => (
                  <figure className="preview-card" key={item.url}>
                    <img src={item.url} alt={item.name} />
                    <figcaption>{item.name}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}

            <button
              className="primary-button"
              disabled={submitting}
              type="submit"
            >
              {submitting
                ? "Enviando reporte..."
                : "Enviar reporte y evidencia"}
            </button>
          </form>
          <StatusBanner status={status} />
        </article>

        <article className="glass-card">
          <SectionHeading
            eyebrow="Últimos reportes"
            title="Historial visible del jefe"
            description="La lista muestra el mismo backend del panel del jefe, útil para verificar sincronización en tiempo real."
          />
          {reports.length ? (
            <div className="mini-list-stack">
              {reports.slice(0, 5).map((report) => (
                <article className="mini-report" key={report.id}>
                  <strong>{report.employee_name}</strong>
                  <span>{formatDate(report.created_at)}</span>
                  <p>{report.observations}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin reportes sincronizados"
              message="Cuando envíes el primer reporte con evidencia, aparecerá aquí y en el panel del jefe."
            />
          )}
        </article>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function QuoteCard({ label, text }) {
  return (
    <div className="quote-card">
      <p className="quote-label">{label}</p>
      <strong>{text}</strong>
    </div>
  );
}

function InfoCard({ title, message }) {
  return (
    <div className="info-card">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="empty-state-card">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

function StatusBanner({ status }) {
  if (!status?.message) {
    return null;
  }

  return <div className={`status-banner ${status.type}`}>{status.message}</div>;
}

function ProgressPanel({ current, limit, alert }) {
  const percentage = Math.min(current / limit, 1) * 100;

  return (
    <div className="progress-panel">
      <div className="progress-copy">
        <strong>
          {current}/{limit} empleados
        </strong>
        <span>{alert ? "Capacidad agotada" : "Capacidad disponible"}</span>
      </div>
      <div className="progress-track">
        <div
          className={alert ? "progress-fill alert" : "progress-fill"}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function formatDate(rawValue) {
  const date = rawValue ? new Date(rawValue) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
