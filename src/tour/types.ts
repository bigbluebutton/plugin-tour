interface TourPluginProps {
    pluginName: string,
    pluginUuid: string,
}

interface Settings {
    url?: {
        general?: string
        screenshare?: string
        whiteboard?: string
    },
}

interface ClientSettingsSubscriptionResultType {
    meeting_clientSettings?: {
        clientSettingsJson: {
            public?: { plugins?: [{ name?: string, settings?: Settings }] },
        }
    }[];
}

export { TourPluginProps, Settings, ClientSettingsSubscriptionResultType };
