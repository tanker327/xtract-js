# X (Twitter) Post Loading Process Documentation

This document details the process of loading X post data programmatically, based on the implementation in `load_post.ts`. This guide is intended to serve as a reference for creating a standalone library for this purpose.

## 1. Overview

The process involves two main steps:
1.  **Authentication**: Obtaining a Guest Token (for public access) or using User Cookies (for authenticated access).
2.  **Data Fetching**: Making a GraphQL request to the X API to retrieve tweet details.

## 2. Constants & Configuration

### 2.1 Public Bearer Token
This token is static and used for guest authentication.
```typescript
const PUBLIC_BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
```

### 2.2 Endpoints
*   **Guest Activation**: `https://api.twitter.com/1.1/guest/activate.json`
*   **GraphQL API Base**: `https://twitter.com/i/api/graphql`

### 2.3 GraphQL Operations

There are two distinct operations depending on the authentication mode.

#### A. Guest Mode (Public)
*   **Operation Name**: `TweetResultByRestId`
*   **Query ID**: `kLXoXTloWpv9d2FSXRg-Tg`
*   **Features**:
    ```json
    {
      "creator_subscriptions_tweet_preview_api_enabled": true,
      "premium_content_api_read_enabled": false,
      "communities_web_enable_tweet_community_results_fetch": true,
      "c9s_tweet_anatomy_moderator_badge_enabled": true,
      "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
      "responsive_web_grok_analyze_post_followups_enabled": false,
      "responsive_web_jetfuel_frame": false,
      "responsive_web_grok_share_attachment_enabled": false,
      "articles_preview_enabled": true,
      "responsive_web_edit_tweet_api_enabled": true,
      "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
      "view_counts_everywhere_api_enabled": true,
      "longform_notetweets_consumption_enabled": true,
      "responsive_web_twitter_article_tweet_consumption_enabled": true,
      "tweet_awards_web_tipping_enabled": false,
      "responsive_web_grok_show_grok_translated_post": false,
      "responsive_web_grok_analysis_button_from_backend": false,
      "creator_subscriptions_quote_tweet_preview_enabled": false,
      "freedom_of_speech_not_reach_fetch_enabled": true,
      "standardized_nudges_misinfo": true,
      "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
      "longform_notetweets_rich_text_read_enabled": true,
      "longform_notetweets_inline_media_enabled": true,
      "profile_label_improvements_pcf_label_in_post_enabled": true,
      "responsive_web_profile_redirect_enabled": true,
      "rweb_tipjar_consumption_enabled": true,
      "verified_phone_label_enabled": false,
      "responsive_web_grok_image_annotation_enabled": false,
      "responsive_web_grok_imagine_annotation_enabled": false,
      "responsive_web_grok_community_note_auto_translation_is_enabled": false,
      "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
      "responsive_web_graphql_timeline_navigation_enabled": true,
      "responsive_web_enhance_cards_enabled": false
    }
    ```
*   **Field Toggles**:
    ```json
    {
      "withArticleRichContentState": true,
      "withArticlePlainText": false,
      "withGrokAnalyze": false,
      "withDisallowedReplyControls": false,
      "withPayments": true,
      "withAuxiliaryUserLabels": false
    }
    ```

#### B. Authenticated Mode (User)
*   **Operation Name**: `TweetDetail`
*   **Query ID**: `6QzqakNMdh_YzBAR9SYPkQ`
*   **Features**: (Slightly different from guest, refer to `load_post.ts` for full list if needed, but Guest Mode is usually preferred for libraries).
*   **Field Toggles**: Similar to Guest Mode.

## 3. Step-by-Step Implementation

### Step 1: Activate Guest Session (Guest Mode Only)
If you do not have user cookies, you must obtain a guest token.

*   **Method**: `POST`
*   **URL**: `https://api.twitter.com/1.1/guest/activate.json`
*   **Headers**:
    *   `Authorization`: `Bearer <PUBLIC_BEARER_TOKEN>`
*   **Body**: Empty JSON object `{}`
*   **Response**:
    ```json
    {
      "guest_token": "1234567890..."
    }
    ```

### Step 2: Construct the Request

#### URL Construction
The URL follows the pattern:
`https://twitter.com/i/api/graphql/{QueryID}/{OperationName}`

For Guest Mode:
`https://twitter.com/i/api/graphql/kLXoXTloWpv9d2FSXRg-Tg/TweetResultByRestId`

#### Headers
*   `Authorization`: `Bearer <PUBLIC_BEARER_TOKEN>`
*   `Content-Type`: `application/json`
*   `x-twitter-active-user`: `yes`
*   `x-twitter-client-language`: `en`
*   **Guest Mode**: `x-guest-token`: `<Guest Token from Step 1>`
*   **Auth Mode**:
    *   `x-csrf-token`: `<CSRF Token>`
    *   `Cookie`: `<Auth Cookie>`

#### Query Parameters (GET Request)
The parameters must be URL-encoded JSON strings.

1.  **variables**:
    *   **Guest Mode**:
        ```json
        {
          "tweetId": "<Target Tweet ID>",
          "withCommunity": false,
          "includePromotedContent": false,
          "withVoice": false
        }
        ```
    *   **Auth Mode**:
        ```json
        {
          "focalTweetId": "<Target Tweet ID>",
          "with_rux_injections": false,
          "includePromotedContent": true,
          "withCommunity": true,
          "withQuickPromoteEligibilityTweetFields": true,
          "withBirdwatchNotes": true,
          "withVoice": true,
          "withV2Timeline": true
        }
        ```

2.  **features**: The JSON object defined in Section 2.3.
3.  **fieldToggles**: The JSON object defined in Section 2.3.

### Step 3: Execute Request
Send a `GET` request to the constructed URL with the headers and query parameters.

### Step 4: Parse Response
The response will be a JSON object. The tweet data is typically found at:
`data.tweetResult.result`

*Note: The structure might vary slightly (e.g., `tweetResult` vs `thread` depending on the query), but for `TweetResultByRestId`, look for `data.tweetResult`.`

## 4. Summary Checklist for Library Creation

1.  [ ] Define `PUBLIC_BEARER_TOKEN` constant.
2.  [ ] Implement `activateGuest()` to fetch `guest_token`.
3.  [ ] Define GraphQL constants (Query ID, Operation Name, Features, Field Toggles).
4.  [ ] Implement `fetchTweet(tweetId, guestToken)`:
    *   Construct URL with Query ID.
    *   Set headers (Auth + Guest Token).
    *   Serialize `variables`, `features`, `fieldToggles` to JSON strings.
    *   Make GET request.
5.  [ ] Handle errors (403 Forbidden often means expired/invalid guest token or bad headers).
