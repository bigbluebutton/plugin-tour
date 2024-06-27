import * as React from 'react';
import { useEffect } from 'react';
import Shepherd from "shepherd.js";
import {IntlShape, createIntl, defineMessages} from 'react-intl'
import {
  BbbPluginSdk, OptionsDropdownOption, PluginApi,
  pluginLogger, UserListUiDataNames, IntlLocaleUiDataNames,
} from 'bigbluebutton-html-plugin-sdk';
import { TourPluginProps } from './types';
import getTourFeatures from "./getTourFeatures";
import "shepherd.js/dist/css/shepherd.css";
import "./custom.css";

const intlMessages = defineMessages({
  start: {
    id: 'app.tour.startTour',
    description: 'start tour button label',
  },
});

/**
 * Starts the tour with the steps defined by getTourFeatures()
 * @param {IntlShape} intl Intl object from react-intl
 * @param {Object} URLS object with urls to link in know more buttons (from settings)
 */
export function startTour(intl: IntlShape, URLS: Object, pluginApi: PluginApi, userListOpened: Boolean) {
    // Docs: https://docs.shepherdpro.com/guides/usage/
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      cancelIcon: {
        enabled: true,
      },
      canClickTarget: false,
    },
    useModalOverlay: true,
  });

  for (const feature of getTourFeatures(intl, tour, URLS, pluginApi, userListOpened)) {
    for (const step of feature.steps) {
      /* @ts-ignore */
      tour.addStep({
        ...step,
        // Only show step if the element is visible
        showOn: () => {
          return !!document.querySelector(
            step.attachTo.element
          );
        },
      });
    }
  }
  tour.start();
}

function TourPlugin(
  { pluginUuid: uuid }: TourPluginProps,
): React.ReactElement<TourPluginProps> {
  BbbPluginSdk.initialize(uuid);
  const [userListInitiallyOpened, setUserListInitiallyOpened] = React.useState(true);
  const pluginApi: PluginApi = BbbPluginSdk.getPluginApi(uuid);
  const userListOpened = pluginApi.useUiData(UserListUiDataNames.USER_LIST_IS_OPEN, { value: true });
  const currentLocale = pluginApi.useUiData(IntlLocaleUiDataNames.CURRENT_LOCALE, {
    locale: 'en',
    fallbackLocale: 'en',
  });
  const settings = pluginApi.usePluginSettings()?.data;

  let messages = {};
  try {
    messages = require(`../locales/${currentLocale.locale.replace('-', '_')}.json`)
  } catch {
    messages = require(`../locales/${currentLocale.fallbackLocale.replace('-', '_')}.json`)
  }

  const intl = createIntl({
    locale: currentLocale.locale,
    messages,
    fallbackOnEmptyString: true,
  });

  useEffect(() => {
    const endTourEvents = ['cancel', 'complete'];

    //restores the panel state after finishing the tour
    endTourEvents.forEach(event => Shepherd.on(event, () => {
      if (userListInitiallyOpened !== userListOpened.value) {
        if (userListInitiallyOpened) {
          pluginApi.uiCommands.sidekickOptionsContainer.open();
        } else {
          pluginApi.uiCommands.sidekickOptionsContainer.close();
        }
      };
      //removes events
      endTourEvents.forEach(event => Shepherd.off(event, undefined));
    }));
    return () => {
      //removes events
      endTourEvents.forEach(event => Shepherd.off(event, undefined)); 
    }
  }, [userListOpened]);

  useEffect(() => {
    pluginApi.setOptionsDropdownItems([
      new OptionsDropdownOption({
        label: intl.formatMessage(intlMessages.start),
        icon: 'presentation',
        onClick: async () => {
          setUserListInitiallyOpened(userListOpened.value);
          pluginLogger.info('Starting Tour');
          // ensure only userList is open (to also work on Mobile)
          pluginApi.uiCommands.sidekickOptionsContainer.close();
          pluginApi.uiCommands.sidekickOptionsContainer.open();
          // wait some time for the ui to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          startTour(intl, settings?.url, pluginApi, userListOpened.value);
        },
      }),
    ]);
  }, [userListOpened, currentLocale, settings]);

  return null;
}

export default TourPlugin;
