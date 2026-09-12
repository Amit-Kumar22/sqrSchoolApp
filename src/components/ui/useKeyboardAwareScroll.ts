import { useCallback, useEffect, useRef } from 'react';
import {
  Keyboard,
  ScrollView,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

/** Breathing room kept between the focused field and the top of the keyboard. */
const GAP = 20;

/**
 * Scrolls the focused input above the keyboard.
 *
 * KeyboardAvoidingView only shrinks the scroll viewport — it never moves the
 * content — so a field lower down stays hidden behind the keyboard without
 * this. Written against RN's own APIs rather than a keyboard library because
 * every native keyboard package needs a dev build, and this project has to keep
 * running in Expo Go.
 *
 * Returns props to spread onto a ScrollView.
 */
export function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  useEffect(() => {
    // `did` rather than `will` on both platforms: by the time it fires, the
    // avoiding view's padding has settled, so the scroll target isn't clamped
    // against a viewport that's about to change.
    const subscription = Keyboard.addListener('keyboardDidShow', (event) => {
      const keyboardTop = event.endCoordinates.screenY;
      setTimeout(() => {
        const focused = TextInput.State.currentlyFocusedInput() as {
          measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
        } | null;
        const scroll = scrollRef.current;
        if (!focused?.measureInWindow || !scroll) return;
        focused.measureInWindow((_x, y, _width, height) => {
          const fieldBottom = y + height + GAP;
          if (fieldBottom <= keyboardTop) return;
          scroll.scrollTo({ y: offsetRef.current + (fieldBottom - keyboardTop), animated: true });
        });
      }, 60);
    });
    return () => subscription.remove();
  }, []);

  return { scrollRef, onScroll, scrollEventThrottle: 16 };
}
