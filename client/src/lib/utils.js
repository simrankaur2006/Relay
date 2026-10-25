export function fmtTime(d) {
  const x = new Date(d);
  const t = x.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return x.toDateString() === new Date().toDateString() ? t : `${x.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${t}`;
}
export const roomKey = (m) => (m.channel ? 'channel:' + m.channel : 'conv:' + m.conversation);
