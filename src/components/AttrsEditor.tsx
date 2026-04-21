import { useMemo, useState } from 'react';

type Attrs = Record<string, unknown>;

interface Props {
  type: 'plant' | 'pot';
  value: Attrs;
  onChange: (next: Attrs) => void;
}

const PLANT_KNOWN = [
  'category',
  'tag',
  'light',
  'water',
  'level',
  'leafColor',
  'spotColor',
  'stripes',
  'vertical',
  'fern',
  'veins',
  'small',
] as const;

const POT_KNOWN = [
  'shape',
  'colorA',
  'colorB',
  'size',
  'height',
  'material',
  'nameItalic',
] as const;

const PLANT_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: '', label: '—' },
  { value: 'easy', label: 'лёгкие в уходе' },
  { value: 'rare', label: 'редкие' },
  { value: 'light', label: 'теневыносливые' },
];

const POT_SHAPES: Array<{ value: string; label: string }> = [
  { value: '', label: '—' },
  { value: 'wave', label: 'волны' },
  { value: 'ribs', label: 'ребро' },
  { value: 'spiral', label: 'спираль' },
  { value: 'hex', label: 'шестигранник' },
  { value: 'crater', label: 'кратер' },
  { value: 'facets', label: 'грани' },
];

export function AttrsEditor({ type, value, onChange }: Props): JSX.Element {
  const known = type === 'plant' ? PLANT_KNOWN : POT_KNOWN;
  const extras = useMemo(() => {
    const kset = new Set<string>(known);
    return Object.entries(value).filter(([k]) => !kset.has(k as never));
  }, [value, known]);

  const [rawOpen, setRawOpen] = useState(false);
  const [raw, setRaw] = useState(() => JSON.stringify(Object.fromEntries(extras), null, 2));
  const [rawError, setRawError] = useState<string | null>(null);

  function set(field: string, v: unknown) {
    const next = { ...value };
    if (v === '' || v === null || v === undefined) {
      delete next[field];
    } else {
      next[field] = v;
    }
    onChange(next);
  }

  function setBool(field: string, checked: boolean) {
    const next = { ...value };
    if (checked) next[field] = true;
    else delete next[field];
    onChange(next);
  }

  function applyRaw() {
    try {
      const parsed = raw.trim() ? JSON.parse(raw) : {};
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        setRawError('Должен быть JSON-объект');
        return;
      }
      setRawError(null);
      const next: Attrs = {};
      for (const k of known) {
        if (k in value) next[k] = value[k];
      }
      for (const [k, v] of Object.entries(parsed)) next[k] = v;
      onChange(next);
    } catch {
      setRawError('Некорректный JSON');
    }
  }

  return (
    <div className="attrs">
      {type === 'plant' ? (
        <PlantFields value={value} set={set} setBool={setBool} />
      ) : (
        <PotFields value={value} set={set} setBool={setBool} />
      )}

      <details
        className="attrs-extra"
        open={rawOpen}
        onToggle={(e) => {
          const open = (e.currentTarget as HTMLDetailsElement).open;
          setRawOpen(open);
          if (open) setRaw(JSON.stringify(Object.fromEntries(extras), null, 2));
        }}
      >
        <summary>
          Дополнительные поля ({extras.length})
        </summary>
        <p className="muted small">
          JSON-объект с произвольными полями помимо типовых. Применяется по кнопке.
        </p>
        <textarea
          rows={6}
          className="mono"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        {rawError ? <p className="error">{rawError}</p> : null}
        <button type="button" className="btn-ghost btn-sm" onClick={applyRaw}>
          Применить JSON
        </button>
      </details>
    </div>
  );
}

function PlantFields({
  value,
  set,
  setBool,
}: {
  value: Attrs;
  set: (f: string, v: unknown) => void;
  setBool: (f: string, c: boolean) => void;
}): JSX.Element {
  return (
    <div className="grid2">
      <label>
        <span>Категория</span>
        <select value={str(value.category)} onChange={(e) => set('category', e.target.value)}>
          {PLANT_CATEGORIES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Тег</span>
        <input
          value={str(value.tag)}
          onChange={(e) => set('tag', e.target.value)}
          placeholder="редкий сорт"
        />
      </label>

      <label>
        <span>Свет</span>
        <input
          value={str(value.light)}
          onChange={(e) => set('light', e.target.value)}
          placeholder="яркий рассеянный"
        />
      </label>
      <label>
        <span>Полив</span>
        <input
          value={str(value.water)}
          onChange={(e) => set('water', e.target.value)}
          placeholder="раз в неделю"
        />
      </label>

      <label>
        <span>Уровень</span>
        <input
          value={str(value.level)}
          onChange={(e) => set('level', e.target.value)}
          placeholder="средний / лёгкий / капризный"
        />
      </label>
      <label>
        <span>&nbsp;</span>
        <div />
      </label>

      <label>
        <span>Цвет листа</span>
        <ColorInput value={str(value.leafColor)} onChange={(v) => set('leafColor', v)} />
      </label>
      <label>
        <span>Цвет пятен</span>
        <ColorInput value={str(value.spotColor)} onChange={(v) => set('spotColor', v)} />
      </label>

      <fieldset className="span2 attrs-flags">
        <legend>Визуальные признаки (svg)</legend>
        <Flag field="stripes" label="полосы" value={value} setBool={setBool} />
        <Flag field="vertical" label="вертикальный" value={value} setBool={setBool} />
        <Flag field="fern" label="папоротник" value={value} setBool={setBool} />
        <Flag field="veins" label="прожилки" value={value} setBool={setBool} />
        <Flag field="small" label="мелкие листья" value={value} setBool={setBool} />
      </fieldset>
    </div>
  );
}

function PotFields({
  value,
  set,
  setBool,
}: {
  value: Attrs;
  set: (f: string, v: unknown) => void;
  setBool: (f: string, c: boolean) => void;
}): JSX.Element {
  return (
    <div className="grid2">
      <label>
        <span>Форма</span>
        <select value={str(value.shape)} onChange={(e) => set('shape', e.target.value)}>
          {POT_SHAPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Материал</span>
        <input
          value={str(value.material)}
          onChange={(e) => set('material', e.target.value)}
          placeholder="PLA мат"
        />
      </label>

      <label>
        <span>Цвет A</span>
        <ColorInput value={str(value.colorA)} onChange={(v) => set('colorA', v)} />
      </label>
      <label>
        <span>Цвет B</span>
        <ColorInput value={str(value.colorB)} onChange={(v) => set('colorB', v)} />
      </label>

      <label>
        <span>Размер</span>
        <input
          value={str(value.size)}
          onChange={(e) => set('size', e.target.value)}
          placeholder="Ø 14 см"
        />
      </label>
      <label>
        <span>Высота</span>
        <input
          value={str(value.height)}
          onChange={(e) => set('height', e.target.value)}
          placeholder="h 13 см"
        />
      </label>

      <label className="span2 check">
        <input
          type="checkbox"
          checked={Boolean(value.nameItalic)}
          onChange={(e) => setBool('nameItalic', e.target.checked)}
        />
        <span>Название курсивом</span>
      </label>
    </div>
  );
}

function Flag({
  field,
  label,
  value,
  setBool,
}: {
  field: string;
  label: string;
  value: Attrs;
  setBool: (f: string, c: boolean) => void;
}): JSX.Element {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={Boolean(value[field])}
        onChange={(e) => setBool(field, e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="color-input">
      <input
        type="color"
        value={valid ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        aria-label="color"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#2d4a2b"
        className="mono"
      />
    </div>
  );
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
