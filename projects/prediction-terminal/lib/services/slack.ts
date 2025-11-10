import { HighPotentialTrend } from '@/lib/types/database';

interface SlackMessageBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  accessory?: any;
}

export async function sendTrendAlert(trend: HighPotentialTrend): Promise<string | null> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return null;
  }

  const potentialEmoji = {
    high: '🔥',
    medium: '⚡',
    low: '💡',
    none: '❌',
  }[trend.market_potential];

  const sourceEmoji = {
    reddit: '🔴',
    x: '𝕏',
    web: '🌐',
  }[trend.source];

  const blocks: SlackMessageBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${potentialEmoji} New Market Opportunity Detected`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${trend.title}*\n\n${trend.summary}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Source:*\n${sourceEmoji} ${trend.source.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Market Potential:*\n${potentialEmoji} ${trend.market_potential.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Confidence:*\n${Math.round(trend.confidence_score * 100)}%`,
        },
        {
          type: 'mrkdwn',
          text: `*Engagement:*\n${trend.engagement_score.toLocaleString()}`,
        },
      ],
    },
  ];

  // Add suggested markets if available
  if (trend.suggested_markets && trend.suggested_markets.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Suggested Markets:*',
      },
    });

    trend.suggested_markets.forEach((market, index) => {
      let marketText = `${index + 1}. *${market.question}*\n`;
      marketText += `   • Type: ${market.market_type}\n`;
      marketText += `   • Resolution: ${market.resolution_criteria}\n`;
      marketText += `   • Est. Liquidity: ${market.estimated_liquidity}`;

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: marketText,
        },
      });
    });
  }

  // Add source link
  if (trend.url) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${trend.url}|View Original Source>`,
      },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Detected at: <!date^${Math.floor(new Date(trend.detected_at).getTime() / 1000)}^{date_short_pretty} at {time}|${trend.detected_at}>`,
      },
    ],
  } as any);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocks,
        text: `${potentialEmoji} New ${trend.market_potential} potential market: ${trend.title}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    // Slack webhooks don't return a timestamp, but we can return success indicator
    return 'success';
  } catch (error) {
    console.error('Error sending Slack alert:', error);
    return null;
  }
}

export async function sendBatchTrendAlerts(
  trends: HighPotentialTrend[]
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  for (const trend of trends) {
    const slackTimestamp = await sendTrendAlert(trend);
    results.set(trend.id, slackTimestamp);

    // Rate limit: wait between messages
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

export async function sendSystemNotification(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `🤖 *System Notification*\n${message}`,
      }),
    });
  } catch (error) {
    console.error('Error sending system notification:', error);
  }
}
