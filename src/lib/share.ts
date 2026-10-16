import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import { haptics } from './haptics';

/** Opens the system share sheet for a campaign link. Returns false if the user dismissed it. */
export async function shareCampaign(campaign: { id: string; title: string }): Promise<boolean> {
  const url = Linking.createURL(`/campaign/${campaign.id}`);
  haptics.tap();
  try {
    const result = await Share.share({
      title: campaign.title,
      message: `${campaign.title}\n${url}`,
      url,
    });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
