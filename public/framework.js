/**
 * @file framework.js — Genesys Cloud Embeddable Framework bridge configuration.
 *
 * This file is loaded by the Genesys Cloud CRM iframe
 * (`https://apps.mypurecloud.com/crm/index.html?crm=framework-local-secure`)
 * from the host page at `https://localhost:443/framework.js`.
 *
 * It exposes a global `window.Framework` object that the embedded client reads
 * on startup to configure OAuth, UI settings, subscriptions, and callback hooks.
 *
 * Communication with the parent React app happens exclusively via
 * `window.parent.postMessage` (outbound) and `window.addEventListener("message")`
 * (inbound).
 *
 * @see https://developer.genesys.cloud/devapps/embeddable-framework/
 */

/**
 * Stores the most recent contact-search success callback so the parent
 * page can asynchronously resolve search results back into the iframe.
 *
 * @type {Function|null}
 */
var contactSearchCallback;

/**
 * @global
 * @namespace Framework
 * @description Root configuration object consumed by the Genesys Cloud
 * Embeddable Framework runtime.  Every property is documented in the
 * Genesys Cloud developer docs under "Embeddable Framework".
 */
window.Framework = {
  /**
   * Static configuration read once at iframe boot.
   *
   * @type {Object}
   * @property {string}   config.name                       — Unique name for this integration instance.
   * @property {Object.<string,string>} config.clientIds    — Map of Genesys Cloud region hostname → OAuth Client ID.
   *   The key must match the region in the iframe URL (e.g. `mypurecloud.com`, `mypurecloud.com.au`).
   *   The value is a **Token Implicit Grant (Browser)** OAuth Client ID created in
   *   Genesys Cloud Admin → Integrations → OAuth.
   * @property {string[]} config.customInteractionAttributes — Interaction attribute keys the framework should track.
   * @property {Object}   config.settings                   — UI and behaviour settings (see nested docs).
   */
  config: {
    name: "GCEmbeddableFrameworkModern",
    clientIds: {
      "usw2.pure.cloud": "2518cd72-b1f9-45ca-8b19-806774b4fb48"
    },
    customInteractionAttributes: [
      "PT_URLPop",
      "PT_SearchValue",
      "PT_TransferContext"
    ],

    /**
     * Embeddable Framework UI / behaviour settings.
     *
     * @type {Object}
     * @property {boolean}  embedWebRTCByDefault        — Embed the WebRTC softphone directly in the client.
     * @property {boolean}  hideWebRTCPopUpOption        — Hide the option to pop the softphone into a separate window.
     * @property {boolean}  enableCallLogs               — Enable the Interaction Log view.
     * @property {boolean}  enableTransferContext         — Allow transfer-context data to be attached to transfers.
     * @property {boolean}  hideCallLogSubject            — Hide the Subject field in the Interaction Log.
     * @property {boolean}  hideCallLogContact            — Hide the Contact field in the Interaction Log.
     * @property {boolean}  hideCallLogRelation           — Hide the Related To field in the Interaction Log.
     * @property {boolean}  dedicatedLoginWindow          — Open OAuth login in a dedicated popup window.
     * @property {boolean}  embeddedInteractionWindow     — Embed the interaction window inside the client.
     * @property {boolean}  enableConfigurableCallerID    — Allow agents to select outbound caller ID.
     * @property {boolean}  enableServerSideLogging       — Send client-side logs to the Genesys Cloud server.
     * @property {boolean}  enableCallHistory              — Show call history in the client.
     * @property {string}   defaultOutboundSMSCountryCode — Default country code for outbound SMS.
     * @property {string[]} searchTargets                 — Entity types available in the transfer/search dialog.
     * @property {string[]} callControls                  — Ordered list of call-control buttons shown during a call.
     * @property {Object}   theme                         — Colour overrides for the embedded client.
     * @property {Object}   display                       — Controls which fields appear in interaction detail views.
     */
    settings: {
      embedWebRTCByDefault: true,
      hideWebRTCPopUpOption: false,
      enableCallLogs: true,
      enableTransferContext: true,
      hideCallLogSubject: true,
      hideCallLogContact: false,
      hideCallLogRelation: false,
      dedicatedLoginWindow: true,
      embeddedInteractionWindow: false,
      enableConfigurableCallerID: false,
      enableServerSideLogging: true,
      enableCallHistory: false,
      defaultOutboundSMSCountryCode: "+1",
      searchTargets: ["people", "queues", "frameworkcontacts", "externalContact"],
      callControls: ["pickup", "hold", "mute", "transfer", "disconnect", "record", "securePause", "dtmf", "scheduleCallback", "flag", "requestAfterCallWork"],
      theme: {
        primary: "#6c63ff",
        text: "#e1e4ed",
        notification: {
          success: {
            primary: "#CCE5FF",
            text: "#004085"
          },
          error: {
            primary: "#f8D7DA",
            text: "#721C24"
          }
        }
      },
      display: {
        interactionDetails: {
          call: [
            "framework.DisplayAddress",
            "call.Ani",
            "call.ConversationId"
          ]
        }
      }
    }
  },

  /**
   * Called once by the embedded client after the PureCloud SDK is ready.
   * Sets up event subscriptions and a `message` listener so the parent
   * React app can drive actions (click-to-dial, status changes, etc.)
   * via `postMessage`.
   *
   * @function
   * @returns {void}
   */
  initialSetup: function () {
    /* ── Event subscriptions ─────────────────────────────────── */
    window.PureCloud.subscribe([
      {
        type: "Interaction",
        /**
         * Fired on every interaction lifecycle change (alerting, connected,
         * disconnected, etc.).
         *
         * @param {string} category  — Event category label.
         * @param {Object} interaction — Full interaction payload.
         */
        callback: function (category, interaction) {
          window.parent.postMessage(
            JSON.stringify({
              type: "interactionSubscription",
              data: { category: category, interaction: interaction }
            }),
            "*"
          );
        }
      },
      {
        type: "UserAction",
        /**
         * Fired when the agent performs a UI action (e.g. clicking a button).
         *
         * @param {string} category — Action category.
         * @param {Object} data     — Action payload.
         */
        callback: function (category, data) {
          window.parent.postMessage(
            JSON.stringify({
              type: "userActionSubscription",
              data: { category: category, data: data }
            }),
            "*"
          );
        }
      },
      {
        type: "Notification",
        /**
         * Fired for contextual notifications from the embedded client.
         *
         * @param {string} category — Notification category.
         * @param {Object} data     — Notification payload.
         */
        callback: function (category, data) {
          window.parent.postMessage(
            JSON.stringify({
              type: "notificationSubscription",
              data: { category: category, data: data }
            }),
            "*"
          );
        }
      }
    ]);

    /* ── Inbound message handler (parent → iframe) ───────────── */
    window.addEventListener("message", function (event) {
      try {
        var message = JSON.parse(event.data);
        if (message) {
          if (message.type == "clickToDial") {
            /** @see https://developer.genesys.cloud/devapps/embeddable-framework/actions#click-to-dial */
            window.PureCloud.clickToDial(message.data);
          } else if (message.type == "addAssociation") {
            /** @see https://developer.genesys.cloud/devapps/embeddable-framework/actions#add-association */
            window.PureCloud.addAssociation(message.data);
          } else if (message.type == "addAttribute") {
            /** @see https://developer.genesys.cloud/devapps/embeddable-framework/actions#add-custom-attributes */
            window.PureCloud.addCustomAttributes(message.data);
          } else if (message.type == "addTransferContext") {
            /** @see https://developer.genesys.cloud/devapps/embeddable-framework/actions#add-transfer-context */
            window.PureCloud.addTransferContext(message.data);
          } else if (message.type == "sendContactSearch") {
            if (contactSearchCallback) {
              contactSearchCallback(message.data);
            }
          } else if (message.type == "updateUserStatus") {
            /** @see https://developer.genesys.cloud/devapps/embeddable-framework/actions#update-user-status */
            window.PureCloud.User.updateStatus(message.data);
          } else if (message.type == "updateInteractionState") {
            /** @see https://developer.genesys.cloud/devapps/embeddable-framework/actions#update-interaction-state */
            window.PureCloud.Interaction.updateState(message.data);
          } else if (message.type == "setView") {
            /** @see https://developer.genesys.cloud/devapps/embeddable-framework/actions#set-view */
            window.PureCloud.User.setView(message.data);
          } else if (message.type == "updateAudioConfiguration") {
            window.PureCloud.User.Notification.setAudioConfiguration(
              message.data
            );
          } else if (message.type == "sendCustomNotification") {
            window.PureCloud.User.Notification.notifyUser(message.data);
          }
        }
      } catch {
        // Ignore non-JSON messages from other sources
      }
    });
  },

  /**
   * Called by the embedded client when an inbound interaction is alerting.
   * Forwards the screen-pop data to the parent React app.
   *
   * @function
   * @param {string} searchString — The ANI or search value for the screen pop.
   * @param {string} interaction  — The interaction ID.
   * @returns {void}
   */
  screenPop: function (searchString, interaction) {
    window.parent.postMessage(
      JSON.stringify({
        type: "screenPop",
        data: { searchString: searchString, interactionId: interaction }
      }),
      "*"
    );
  },

  /**
   * Called when the embedded client needs to create or update a call log
   * entry (e.g. on wrap-up, attribute change, or disconnect).
   *
   * @function
   * @param {Object}   callLog     — The call-log payload (subject, notes, etc.).
   * @param {string}   interaction — The interaction ID.
   * @param {string}   eventName   — Lifecycle event that triggered the log (e.g. "wrap-up").
   * @param {Function} onSuccess   — Callback to acknowledge successful processing.
   * @param {Function} onFailure   — Callback to signal a processing error.
   * @returns {void}
   */
  processCallLog: function (
    callLog,
    interaction,
    eventName,
    onSuccess,
    onFailure
  ) {
    window.parent.postMessage(
      JSON.stringify({
        type: "processCallLog",
        data: {
          callLog: callLog,
          interactionId: interaction,
          eventName: eventName
        }
      }),
      "*"
    );
    onSuccess({ id: callLog.id || Date.now() });
  },

  /**
   * Called when the user clicks the detail arrow on an Interaction Log entry.
   *
   * @function
   * @param {Object} callLog     — The call-log record.
   * @param {Object} interaction — The associated interaction.
   * @returns {void}
   */
  openCallLog: function (callLog, interaction) {
    window.parent.postMessage(
      JSON.stringify({
        type: "openCallLog",
        data: { callLog: callLog, interaction: interaction }
      }),
      "*"
    );
  },

  /**
   * Called when the embedded client performs a contact search (e.g. during
   * transfer).  The `onSuccess` callback is stored so the parent app can
   * asynchronously return results via a `sendContactSearch` postMessage.
   *
   * @function
   * @param {string}   searchString — The user's search query.
   * @param {Function} onSuccess    — Callback that accepts an array of contact results.
   * @param {Function} onFailure    — Callback to signal a search error.
   * @returns {void}
   */
  contactSearch: function (searchString, onSuccess, onFailure) {
    contactSearchCallback = onSuccess;
    window.parent.postMessage(
      JSON.stringify({
        type: "contactSearch",
        data: { searchString: searchString }
      }),
      "*"
    );
  }
};
