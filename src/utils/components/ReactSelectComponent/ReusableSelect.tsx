import React, { forwardRef, useMemo } from "react";
import Select, {
  GroupBase,
  SingleValue,
  MultiValue,
  SelectInstance,
  Props as RSProps,
} from "react-select";

type Primitive = string | number;
type OptionOf<T> = { value: Primitive; label: string; raw: T };

type PassThroughProps<O, I extends boolean> = Omit<
  RSProps<O, I, GroupBase<O>>,
  "options" | "value" | "onChange" | "isMulti" | "getOptionValue"
>;

type CommonProps<T> = {
  items: T[];
  getValue: (t: T) => Primitive;
  getLabel: (t: T) => string;
  placeholder?: string;
  isClearable?: boolean;
};

type SingleProps<T> = CommonProps<T> & {
  isMulti?: false; // single por defecto
  value?: T | null;
  onChange?: (v: T | null) => void;
  selectProps?: PassThroughProps<OptionOf<T>, false>;
};

type MultiProps<T> = CommonProps<T> & {
  isMulti: true;
  value?: T[];
  onChange?: (v: T[]) => void;
  selectProps?: PassThroughProps<OptionOf<T>, true>;
};

export type ReusableSelectProps<T> = SingleProps<T> | MultiProps<T>;

function ReusableSelectInner<T>(
  props: ReusableSelectProps<T>,
  ref: React.Ref<SelectInstance<OptionOf<T>, any, GroupBase<OptionOf<T>>>>
) {
  const {
    items,
    getValue,
    getLabel,
    placeholder = "Selecciona…",
    isClearable = true,
  } = props;

  const options = useMemo<OptionOf<T>[]>(() => {
    return items.map((it) => ({
      value: getValue(it),
      label: String(getLabel(it)),
      raw: it,
    }));
  }, [items, getValue, getLabel]);

  const resolvedValue = useMemo(() => {
    const byKey = new Map<Primitive, OptionOf<T>>();
    for (const opt of options) byKey.set(opt.value, opt);

    if ("isMulti" in props && props.isMulti) {
      const arr = props.value ?? [];
      return arr
        .map((it) => byKey.get(getValue(it)))
        .filter(Boolean) as OptionOf<T>[];
    } else {
      const v = props.value ?? null;
      return v ? byKey.get(getValue(v)) ?? null : null;
    }
  }, [options, props, getValue]);

  const handleChange = (
    val: SingleValue<OptionOf<T>> | MultiValue<OptionOf<T>>
  ) => {
    if ("isMulti" in props && props.isMulti) {
      const arr = (val as MultiValue<OptionOf<T>>)?.map((v) => v.raw) ?? [];
      props.onChange?.(arr);
    } else {
      const single = (val as SingleValue<OptionOf<T>>) ?? null;
      props.onChange?.(single ? single.raw : null);
    }
  };

  // 🔴 IMPORTANTE: ramificar para preservar los literales y tipos del ref
  if ("isMulti" in props && props.isMulti) {
    return (
      <Select<OptionOf<T>, true>
        ref={ref as React.Ref<SelectInstance<OptionOf<T>, true>>}
        isMulti={true} // literal TRUE
        options={options}
        value={resolvedValue as OptionOf<T>[]}
        onChange={handleChange as (v: MultiValue<OptionOf<T>>) => void}
        isClearable={isClearable}
        placeholder={placeholder}
        getOptionValue={(opt) => String(opt.value)}
        {...(props.selectProps as PassThroughProps<OptionOf<T>, true>)}
      />
    );
  }

  return (
    <Select<OptionOf<T>, false>
      ref={ref as React.Ref<SelectInstance<OptionOf<T>, false>>}
      isMulti={false} // literal FALSE
      options={options}
      value={resolvedValue as SingleValue<OptionOf<T>>}
      onChange={handleChange as (v: SingleValue<OptionOf<T>>) => void}
      isClearable={isClearable}
      placeholder={placeholder}
      getOptionValue={(opt) => String(opt.value)}
      {...(props.selectProps as PassThroughProps<OptionOf<T>, false>)}
    />
  );
}

export const ReusableSelect = forwardRef(
  ReusableSelectInner
) as // Sobrecargas para mejorar intellisense del ref y props según variante
(<T>(
  p: SingleProps<T> & {
    ref?: React.Ref<SelectInstance<OptionOf<T>, false>>;
  }
) => ReturnType<typeof ReusableSelectInner>) &
  (<T>(
    p: MultiProps<T> & {
      ref?: React.Ref<SelectInstance<OptionOf<T>, true>>;
    }
  ) => ReturnType<typeof ReusableSelectInner>);
