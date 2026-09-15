import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const STORAGE_KEY = "holp-native-tasks-v1";
const MEMBERS = [
  { name: "Jan", initials: "JT", color: "#c5e5ff" },
  { name: "Laia", initials: "LA", color: "#d8cef8" },
  { name: "Pau", initials: "PA", color: "#ffd9bd" },
];
const REPEATS = ["Cap", "Setmanal", "Cada 2 setmanes", "Mensual"];
const REMINDERS = [0, 15, 30, 60];

const initialTasks = [
  {
    id: "1",
    title: "Netejar el bany",
    assignee: "Laia",
    date: "2026-09-21",
    time: "18:30",
    recurrence: "Setmanal",
    reminderMinutes: 30,
    notificationId: null,
    done: false,
  },
  {
    id: "2",
    title: "Fer la compra",
    assignee: "Jan",
    date: "2026-09-16",
    time: "19:00",
    recurrence: "Setmanal",
    reminderMinutes: 15,
    notificationId: null,
    done: false,
  },
];

function parseDateTime(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const value = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day ||
    value.getHours() !== hour ||
    value.getMinutes() !== minute
  ) return null;
  return value;
}

async function ensureNotificationPermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("tasques", {
      name: "Recordatoris de tasques",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: "#BDF56B",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function scheduleTask(task) {
  const allowed = await ensureNotificationPermission();
  if (!allowed) throw new Error("permission");
  const due = parseDateTime(task.date, task.time);
  if (!due) throw new Error("invalid-date");
  const triggerDate = new Date(due.getTime() - task.reminderMinutes * 60_000);
  if (triggerDate <= new Date()) throw new Error("past");
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Toca: ${task.title}`,
      body: task.reminderMinutes
        ? `Comença en ${task.reminderMinutes} minuts · ${task.assignee}`
        : `És l’hora · ${task.assignee}`,
      sound: "default",
      data: { taskId: task.id, screen: "tasks" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: "tasques",
    },
  });
}

function todayISO() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

export default function App() {
  const [tab, setTab] = useState("today");
  const [tasks, setTasks] = useState(initialTasks);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [form, setForm] = useState({
    title: "",
    assignee: "Jan",
    date: todayISO(),
    time: "18:00",
    recurrence: "Cap",
    reminderMinutes: 15,
    remind: true,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => value && setTasks(JSON.parse(value)))
      .catch(() => {})
      .finally(() => setLoaded(true));
    Notifications.getPermissionsAsync().then(p =>
      setNotificationsEnabled(
        p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
      )
    );
    const sub = Notifications.addNotificationResponseReceivedListener(() => setTab("tasks"));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch(() => {});
  }, [tasks, loaded]);

  const pending = useMemo(() => tasks.filter(t => !t.done), [tasks]);
  const todayTasks = pending.filter(t => t.date === todayISO());

  async function addTask() {
    if (!form.title.trim()) return Alert.alert("Falta el nom", "Escriu què s’ha de fer.");
    const due = parseDateTime(form.date, form.time);
    if (!due) return Alert.alert("Data incorrecta", "Utilitza AAAA-MM-DD i HH:MM.");
    const task = { ...form, id: String(Date.now()), title: form.title.trim(), done: false, notificationId: null };
    if (form.remind) {
      try {
        task.notificationId = await scheduleTask(task);
        setNotificationsEnabled(true);
      } catch (error) {
        const message = error.message === "permission"
          ? "Activa les notificacions als ajustos del mòbil."
          : error.message === "past"
            ? "El recordatori ha de ser en el futur."
            : "Revisa la data i l’hora.";
        return Alert.alert("No s’ha pogut programar", message);
      }
    }
    setTasks(current => [task, ...current]);
    setModal(false);
    setForm(current => ({ ...current, title: "", date: todayISO(), time: "18:00" }));
    setTab("tasks");
  }

  async function completeTask(task) {
    if (task.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(task.notificationId).catch(() => {});
    }
    setTasks(current => current.map(t => t.id === task.id ? { ...t, done: !t.done, notificationId: null } : t));
  }

  async function removeTask(task) {
    if (task.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(task.notificationId).catch(() => {});
    }
    setTasks(current => current.filter(t => t.id !== task.id));
  }

  async function testNotification() {
    const allowed = await ensureNotificationPermission();
    setNotificationsEnabled(allowed);
    if (!allowed) return Alert.alert("Notificacions desactivades", "Activa-les als ajustos del mòbil.");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "HOLP funciona ✓",
        body: "Les notificacions de tasques estan activades.",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: "tasques",
      },
    });
    Alert.alert("Prova programada", "Rebràs una notificació d’aquí a 5 segons.");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topbar}>
        <View style={styles.logo}><Text style={styles.logoText}>H</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.homeTitle}>Casa Balmes</Text>
          <Text style={styles.muted}>3 membres</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>JT</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === "today" && (
          <>
            <Text style={styles.eyebrow}>AVUI · {todayISO()}</Text>
            <Text style={styles.title}>Bon dia, Jan</Text>
            <View style={styles.balanceCard}>
              <View><Text style={styles.darkMuted}>Equilibri aquesta setmana</Text><Text style={styles.balance}>92%</Text><Text style={styles.darkSmall}>Una llar ben repartida</Text></View>
              <Text style={styles.scale}>⚖️</Text>
            </View>
            <SectionTitle title="Tasques d’avui" action="Afegir" onPress={() => setModal(true)} />
            {(todayTasks.length ? todayTasks : pending.slice(0, 3)).map(task => (
              <TaskCard key={task.id} task={task} onComplete={completeTask} onDelete={removeTask} />
            ))}
            {!pending.length && <Empty text="Tot fet. Bona feina!" />}
            <View style={styles.tip}>
              <Text style={styles.tipStar}>✦</Text>
              <View style={{ flex: 1 }}><Text style={styles.tipTitle}>Recordatoris intel·ligents</Text><Text style={styles.tipText}>HOLP t’avisa abans de l’hora que has indicat i cancel·la l’avís quan completes la tasca.</Text></View>
            </View>
          </>
        )}

        {tab === "tasks" && (
          <>
            <Text style={styles.eyebrow}>ORGANITZACIÓ</Text>
            <View style={styles.titleRow}><Text style={styles.title}>Tasques</Text><Pressable style={styles.primarySmall} onPress={() => setModal(true)}><Text style={styles.primarySmallText}>＋ Nova</Text></Pressable></View>
            {pending.map(task => <TaskCard key={task.id} task={task} onComplete={completeTask} onDelete={removeTask} />)}
            {!pending.length && <Empty text="No tens tasques pendents." />}
            <SectionTitle title="Completades" />
            {tasks.filter(t => t.done).map(task => <TaskCard key={task.id} task={task} onComplete={completeTask} onDelete={removeTask} />)}
          </>
        )}

        {tab === "settings" && (
          <>
            <Text style={styles.eyebrow}>CONFIGURACIÓ</Text>
            <Text style={styles.title}>Notificacions</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingsRow}>
                <View style={{ flex: 1 }}><Text style={styles.cardTitle}>Permís del dispositiu</Text><Text style={styles.cardMeta}>{notificationsEnabled ? "Activat" : "Encara no activat"}</Text></View>
                <View style={[styles.status, notificationsEnabled && styles.statusOn]}><Text>{notificationsEnabled ? "✓" : "!"}</Text></View>
              </View>
              <Pressable style={styles.testButton} onPress={testNotification}><Text style={styles.testButtonText}>Enviar notificació de prova</Text></Pressable>
            </View>
            <Text style={styles.help}>Quan creïs una tasca, podràs decidir si vols l’avís a l’hora exacta o 15, 30 o 60 minuts abans.</Text>
          </>
        )}
      </ScrollView>

      <View style={styles.nav}>
        <NavButton label="Avui" icon="⌂" active={tab === "today"} onPress={() => setTab("today")} />
        <NavButton label="Tasques" icon="✓" active={tab === "tasks"} onPress={() => setTab("tasks")} />
        <Pressable style={styles.addButton} onPress={() => setModal(true)}><Text style={styles.addText}>＋</Text></Pressable>
        <NavButton label="Agenda" icon="▦" active={false} onPress={() => Alert.alert("Següent entrega", "Connectarem l’agenda completa després de validar les notificacions.")} />
        <NavButton label="Ajustos" icon="⚙" active={tab === "settings"} onPress={() => setTab("settings")} />
      </View>

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}><Text style={styles.sheetTitle}>Nova tasca</Text><Pressable onPress={() => setModal(false)}><Text style={styles.close}>×</Text></Pressable></View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Label text="Què s’ha de fer?" />
              <TextInput value={form.title} onChangeText={title => setForm({ ...form, title })} placeholder="Ex. Netejar la cuina" style={styles.input} />
              <Label text="Responsable" />
              <ChipRow options={MEMBERS.map(m => m.name)} value={form.assignee} onChange={assignee => setForm({ ...form, assignee })} />
              <View style={styles.twoCols}>
                <View style={{ flex: 1 }}><Label text="Data" /><TextInput value={form.date} onChangeText={date => setForm({ ...form, date })} placeholder="AAAA-MM-DD" style={styles.input} keyboardType="numbers-and-punctuation" /></View>
                <View style={{ flex: 1 }}><Label text="Hora" /><TextInput value={form.time} onChangeText={time => setForm({ ...form, time })} placeholder="HH:MM" style={styles.input} keyboardType="numbers-and-punctuation" /></View>
              </View>
              <Label text="Repetició" />
              <ChipRow options={REPEATS} value={form.recurrence} onChange={recurrence => setForm({ ...form, recurrence })} />
              <View style={styles.switchRow}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Recordatori</Text><Text style={styles.cardMeta}>Notificació al mòbil</Text></View><Switch value={form.remind} onValueChange={remind => setForm({ ...form, remind })} trackColor={{ true: "#16634b" }} /></View>
              {form.remind && <><Label text="Quan vols l’avís?" /><ChipRow options={REMINDERS} value={form.reminderMinutes} format={n => n === 0 ? "A l’hora" : `${n} min abans`} onChange={reminderMinutes => setForm({ ...form, reminderMinutes })} /></>}
              <Pressable style={styles.submit} onPress={addTask}><Text style={styles.submitText}>Crear tasca i programar avís</Text></Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({ title, action, onPress }) {
  return <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action && <Pressable onPress={onPress}><Text style={styles.action}>{action}</Text></Pressable>}</View>;
}
function TaskCard({ task, onComplete, onDelete }) {
  const member = MEMBERS.find(m => m.name === task.assignee) || MEMBERS[0];
  return (
    <View style={[styles.task, task.done && styles.taskDone]}>
      <Pressable style={[styles.check, task.done && styles.checkDone]} onPress={() => onComplete(task)}><Text style={styles.checkText}>{task.done ? "✓" : ""}</Text></Pressable>
      <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{task.title}</Text><Text style={styles.cardMeta}>{task.date} · {task.time} · {task.recurrence}</Text>{task.notificationId && !task.done && <Text style={styles.reminder}>🔔 {task.reminderMinutes ? `${task.reminderMinutes} min abans` : "A l’hora"}</Text>}</View>
      <Pressable onLongPress={() => onDelete(task)} style={[styles.person, { backgroundColor: member.color }]}><Text style={styles.personText}>{member.initials}</Text></Pressable>
    </View>
  );
}
function ChipRow({ options, value, onChange, format = x => x }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{options.map(option => <Pressable key={String(option)} onPress={() => onChange(option)} style={[styles.chip, value === option && styles.chipSelected]}><Text style={[styles.chipText, value === option && styles.chipTextSelected]}>{format(option)}</Text></Pressable>)}</ScrollView>;
}
function Label({ text }) { return <Text style={styles.label}>{text}</Text>; }
function Empty({ text }) { return <View style={styles.empty}><Text style={styles.muted}>{text}</Text></View>; }
function NavButton({ label, icon, active, onPress }) {
  return <Pressable style={styles.navItem} onPress={onPress}><Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text><Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7f4", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  topbar: { minHeight: 70, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#dde3df" },
  logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#101a17", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#bdf56b", fontSize: 20, fontWeight: "900" },
  homeTitle: { fontSize: 16, fontWeight: "700", color: "#101a17" },
  muted: { color: "#68736f", fontSize: 13 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#d8cef8", alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800" },
  content: { padding: 20, paddingBottom: 110 },
  eyebrow: { color: "#16634b", fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginTop: 8, marginBottom: 5 },
  title: { color: "#101a17", fontSize: 34, fontWeight: "900", letterSpacing: -1.4, marginBottom: 20 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  balanceCard: { backgroundColor: "#101a17", borderRadius: 24, padding: 21, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  darkMuted: { color: "#bfc9c5" }, balance: { color: "#bdf56b", fontSize: 45, fontWeight: "900" }, darkSmall: { color: "#fff", fontSize: 13 }, scale: { fontSize: 36 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 27, marginBottom: 11 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#101a17" }, action: { color: "#16634b", fontWeight: "800" },
  task: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#dde3df", borderRadius: 18, padding: 13, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 11 },
  taskDone: { opacity: 0.55 }, check: { width: 40, height: 40, borderRadius: 13, borderWidth: 2, borderColor: "#cad2cd", alignItems: "center", justifyContent: "center" },
  checkDone: { backgroundColor: "#16634b", borderColor: "#16634b" }, checkText: { color: "#fff", fontWeight: "900" },
  cardTitle: { color: "#101a17", fontWeight: "800", fontSize: 16 }, cardMeta: { color: "#68736f", fontSize: 13, marginTop: 3 }, reminder: { color: "#16634b", fontSize: 12, fontWeight: "700", marginTop: 4 },
  person: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" }, personText: { fontSize: 12, fontWeight: "900" },
  tip: { marginTop: 20, backgroundColor: "#e7f4c9", borderRadius: 18, padding: 15, flexDirection: "row", gap: 11 }, tipStar: { fontSize: 22 }, tipTitle: { fontWeight: "800" }, tipText: { color: "#435047", marginTop: 3, lineHeight: 19 },
  primarySmall: { backgroundColor: "#16634b", borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12 }, primarySmallText: { color: "#fff", fontWeight: "800" },
  settingsCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#dde3df", borderRadius: 20, padding: 17 },
  settingsRow: { flexDirection: "row", alignItems: "center" }, status: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#ffd9bd", alignItems: "center", justifyContent: "center" }, statusOn: { backgroundColor: "#bdf56b" },
  testButton: { backgroundColor: "#101a17", borderRadius: 13, padding: 14, marginTop: 18, alignItems: "center" }, testButtonText: { color: "#fff", fontWeight: "800" }, help: { color: "#68736f", lineHeight: 22, marginTop: 16 },
  nav: { position: "absolute", bottom: 0, left: 0, right: 0, minHeight: 82, paddingBottom: Platform.OS === "ios" ? 16 : 8, backgroundColor: "#fff", borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#dde3df", flexDirection: "row", alignItems: "center" },
  navItem: { flex: 1, alignItems: "center", gap: 2 }, navIcon: { color: "#85908b", fontSize: 19 }, navLabel: { color: "#85908b", fontSize: 11, fontWeight: "700" }, navActive: { color: "#16634b" },
  addButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#101a17", alignItems: "center", justifyContent: "center", marginHorizontal: 4 }, addText: { color: "#bdf56b", fontSize: 28 },
  overlay: { flex: 1, backgroundColor: "rgba(6,14,11,.58)", justifyContent: "flex-end" }, sheet: { backgroundColor: "#fff", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, maxHeight: "92%" },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, sheetTitle: { fontSize: 23, fontWeight: "900" }, close: { fontSize: 32, color: "#68736f" },
  label: { fontWeight: "800", fontSize: 14, marginTop: 15, marginBottom: 7 }, input: { borderWidth: 1, borderColor: "#cad2cd", borderRadius: 13, padding: 13, fontSize: 16, backgroundColor: "#fff" },
  twoCols: { flexDirection: "row", gap: 10 }, chips: { gap: 8, paddingBottom: 3 }, chip: { borderWidth: 1, borderColor: "#cad2cd", borderRadius: 20, paddingVertical: 9, paddingHorizontal: 13 }, chipSelected: { backgroundColor: "#101a17", borderColor: "#101a17" }, chipText: { color: "#435047", fontWeight: "700" }, chipTextSelected: { color: "#fff" },
  switchRow: { flexDirection: "row", alignItems: "center", marginTop: 18, padding: 14, backgroundColor: "#f1f4f1", borderRadius: 15 },
  submit: { backgroundColor: "#16634b", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 22, marginBottom: 15 }, submitText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  empty: { borderWidth: 1, borderStyle: "dashed", borderColor: "#cad2cd", borderRadius: 16, padding: 20, alignItems: "center" },
});
