- add icons better icons, especially color in the tray
- see bugs in `docs/diagnosis-src-issues.md`
- support npx... good if you keep it opensource
- make it installable
- make it cross plateform


---
## DONE List
- DONE it never work in french... how come
  - maybe i dont the configuration into account
  - e.g.
    1. change the default language to french and model to large-v1 
    2. remove the whisper-cpp folder
    3. relaunch and let it load the large model
    4. test if it works in french
    5. !??!? and first thing it load the 'medium.en' default model
    6. hint the config is ignored
- DONE store the history in a file.... thus if i relaunch the app, i can see the history of the transcribed text
- DONE Update CSS as little as possible in the public pages.
- DONE When the configuration changes, relaunch the whole application.
- DONE provide a configuration page 
  - model selection
  - language selection... can it do multiple languages at the same time?
- DONE store a config file on disk for the settings
  - then edit it, and reload it when the app is running
- DONE rename `Voice2Kbd` to `Voice2Kbd`
- DONE try to open native window for ABOUT
- DONE for a UX workflow, for the copy transcribed text, we can use the system clipboard
- DONE it require to receive global key binding
- DONE it require to receive audio input from the microphone
- DONE check if the permissions are granted for both of these
  - else ask for it