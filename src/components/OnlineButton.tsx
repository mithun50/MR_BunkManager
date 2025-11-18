import React from 'react';
import { Button, ButtonProps } from 'react-native-paper';
import { withOnlineCheck } from '../utils/offlineHelper';

interface OnlineButtonProps extends Omit<ButtonProps, 'onPress'> {
  onPress: () => void | Promise<void>;
  requiresOnline?: boolean;
  offlineMessage?: string;
  offlineTitle?: string;
  allowOfflineWithWarning?: boolean;
}

/**
 * Button component that checks for internet connection before executing onPress
 * Usage:
 * <OnlineButton
 *   mode="contained"
 *   onPress={handleSubmit}
 *   requiresOnline={true}
 *   offlineMessage="You need internet to submit this form"
 * >
 *   Submit
 * </OnlineButton>
 */
export default function OnlineButton({
  onPress,
  requiresOnline = true,
  offlineMessage,
  offlineTitle,
  allowOfflineWithWarning = false,
  ...buttonProps
}: OnlineButtonProps) {
  const handlePress = requiresOnline
    ? withOnlineCheck(onPress, {
        message: offlineMessage,
        title: offlineTitle,
        allowOffline: allowOfflineWithWarning,
      })
    : onPress;

  return <Button {...buttonProps} onPress={handlePress} />;
}
