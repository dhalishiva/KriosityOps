import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, useTheme } from '../lib/theme';
import { Button, IconButton, T } from './ui';

/** A bottom sheet: scrim, drag handle, title, scrollable body, footer pinned under it. */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim }} />
        <View
          style={{
            backgroundColor: c.paper,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            maxHeight: '92%',
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.line2 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 6, paddingTop: 6 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="h2">{title}</T>
              {subtitle ? <T v="caption">{subtitle}</T> : null}
            </View>
            <IconButton icon="close" label="Close" onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 14 }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: 16, gap: 8 }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** In-app confirm, used instead of a system dialog so it matches the rest of the app. */
export function Confirm({
  visible,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
  loading,
  children,
  confirmDisabled,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  children?: ReactNode;
  confirmDisabled?: boolean;
}) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Cancel" kind="ghost" onPress={onClose} style={{ flex: 1 }} />
          <Button title={confirmLabel} kind={danger ? 'danger' : 'primary'} loading={loading} disabled={confirmDisabled} onPress={onConfirm} style={{ flex: 1 }} />
        </View>
      }
    >
      <T v="body">{body}</T>
      {children}
    </Sheet>
  );
}
