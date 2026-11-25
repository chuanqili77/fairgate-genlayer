import type { FormEvent } from 'react';

export default function Organizer({ zh, disabled, onCreate }: {
  zh: boolean; disabled: boolean; onCreate: (args: (string | number)[]) => void;
}) {
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '').trim();
    const offset = Number(value('offset'));
    const timestamp = Date.parse(value('time') + 'Z') / 1000 - offset * 60;
    if (!Number.isSafeInteger(timestamp)) return;
    onCreate([value('artist'), value('venue'), value('city'), value('recipient'), timestamp, offset, value('sourceA'), value('sourceB')]);
  }
  const labels = zh ? ['艺人','场馆','城市','版税接收地址','当地开演时间','UTC 偏移（分钟）','证据链接 A','证据链接 B'] :
    ['Artist','Venue','City','Royalty wallet','Local show time','UTC offset in minutes','Evidence URL A','Evidence URL B'];
  return <form className="organizer-console" onSubmit={create}>
    <p>{zh ? '签名钱包将成为主办方。开售后证据来源锁定，两条链接须来自不同的受支持发布者。' :
      'The signing wallet owns this event. Evidence sources are locked at creation and must come from two supported publishers.'}</p>
    <div className="organizer-fields">
      {['artist','venue','city'].map((field,i) => <label key={field}>{labels[i]}<input name={field} maxLength={100} required /></label>)}
      <label>{labels[3]}<input name="recipient" pattern="0x[a-fA-F0-9]{40}" required /></label>
      <label>{labels[4]}<input name="time" type="datetime-local" required /></label>
      <label>{labels[5]}<input name="offset" type="number" min="-720" max="840" defaultValue="0" required /></label>
      <label>{labels[6]}<input name="sourceA" type="url" required /></label>
      <label>{labels[7]}<input name="sourceB" type="url" required /></label>
    </div>
    <p className="small dim">Radio X · The Independent · Bridgestone Arena · do615 · Target Center · iHeart</p>
    <button className="btn btn-primary" disabled={disabled} type="submit">{zh ? '签名创建活动' : 'Sign and create event'}</button>
  </form>;
}
