![build](https://github.com/rajyraman/Levelup-for-Dynamics-CRM/workflows/build/badge.svg)

## Summary
Chrome Extension for Dynamics CRM/365/ Power Apps Power users

![Level up screenshot](/screenshots/Levelup.png)

## Usage
You can install the extension on Edge, Firefox and Chrome.

Browser | Store Link
--- | ---
**Chrome** | https://chrome.google.com/webstore/detail/level-up-for-dynamics-crm/bjnkkhimoaclnddigpphpgkfgeggokam
**Firefox** | https://addons.mozilla.org/en-US/firefox/addon/level-up-for-d365-power-apps/
**Edge** | https://microsoftedge.microsoft.com/addons/detail/level-up-for-dynamics-365/mdjlgdkgmhlmcikdmeehcecolehipicf

## Detailed Functionality

### Form Actions

| # | Action | What it does |
| --- | --- | -- |
1 | **Logical Names** | Displays logical names for fields, tabs and sections.
2 | **Clear Logical Names** | Restores the form to the original state, by removing the schema name textboxes.
3 | **Blur Fields** | Blurs all form fields and subgrids on the form.
4 | **Reset Blur** | Puts the form back in the default state with fields not blurred.
5 | **God Mode** | Makes all mandatory fields optional. Makes hidden fields/tabs/sections visible. Makes read-only fields editable.
6 | **All Fields** | Displays values for all fields not in the current form
7 | **Changed Fields** | Highlights fields in the form that have been changed, but not saved yet.
8 | **Record URL** | Displays the current record URL in a dialog. The URL can be copied from the dialog and dismissed.
9 | **Record Id** | Displays the current record Id in a dialog. The Id can be copied from the dialog and dismissed.
10 | **Open Record in Web API** | Opens the current record in a new tab with Web API URL.
11 | **Refresh All subgrids** | Refreshes all the subgrids on the current form. It does not refresh the associated views.
12 | **Minimum values** | This is intended for use on a new record. It fills out minimum values for all required fields. Only the following field types are filled out automatically: Memo, String, Boolean, DateTime, Decimal, Double, Integer, Money and OptionSet.
13 | **Show Optionset values** | Updates all the OptionSet fields on the current form to show text as well the the value of the OptionSet.
14 | **Clone Record** | Use the record parameters functionality and display a new popup which is a clone of the current record. This clone does not include the child records.
15 | **Refresh + Autosave off** | Refreshes the current form without saving it. It also turns off the auto-save after refresh.
16 | **Toggle Tabs** | Collapses or expands the tabs in the form.
17 | **Processes & Business Rules** | Displays any workflows, actions and business rules for the current entity.
18 | **Record Properties** | Displays information about current record like Created By, Created On, Modified By, Modified on, Permissions and Owner.

### Navigation Actions

| # | Action | What it does |
| --- | --- | -- |
1 | **Open record By Id** | Displays a dialog to get the entity schemaname and record id. Once this is given, it opens a new popup to show the record.
2 | **New record** | Displays a dialog to get the entity schemaname. Once this is given, it opens a new popup to create a new record.
3 | **Open list** | Displays a dialog to get the entity schemaname. Once this is given, it opens a new popup to show the entity list.
4 | **Security** | Displays the security area from the sitemap.
5 | **System Jobs** | Displays the system jobs from the sitemap.
6 | **Solutions** | Displays the solutions area from the sitemap.
7 | **Process** | Displays the processes area from the sitemap.
8 | **Mailboxes** | Displays the mailboxes list.
9 | **Open Main** | Opens the CRM homepage (main.aspx) on a new window.
10 | **Advanced Find** | Opens Advanced Find in a new window.
11 | **Mobile Client** | Opens the mobile client (MoCA) in a new window.
12 | **Perf Diag** | Displays the performance diagnostics page. Primarily useful for assessing network performance. Refer https://mbs.microsoft.com/customersource/Global/CRM/learning/documentation/user-guides/PerformanceOptimizationsCRMOnlineSuccess.
13 | **Perf Center** | Displays the performance center page. Primarily used to assess slow form performance. Can be used in conjunction with DevTools. Refer http://blog.cobalt.net/blog/understanding-the-microsoft-dynamics-crm-performance-center
14 | **Instance Picker** | Displays the instance picker page (applicable to Dynamics CRM/365 Online only).
15 | **Power Platform Admin** | Opens admin.powerplatform.microsoft.com
16 | **Solutions History** | Display Solutions History page to see the list of solutions imported into the environment.

### View Actions

| # | Action | What it does |
| --- | --- | -- |
1 | **New window** | Displays the current grid (Saved Query) in a new window.
2 | **Quick Find fields** | Displays the search fields for the current entity that is displayed in the grid.
3 | **Blur Fields** | Blurs all columns in the currently displayed view.
4 | **Reset Blur** | Puts the view back in the default state with columns not blurred.
5 | **Open view in FetchXML Builder** | Opens FetchXML from current view and opens it in FetchXML Builder. This requires [Application Protocol](https://fetchxmlbuilder.com/sharing-queries/) enabled in XrmToolBox.

### Hamburger menu Actions

| # | Action | What it does |
| --- | --- | -- |
1 | **Environment Details** | Displays information that can be used for support requests like TenantId, EnvironmentId, OrganizationVersion etc.
2 | **Environment Settings** | Displays some useful information about the current "Organization" you are connected to in a popup.
3 | **My Roles** | Displays the user roles, that you user record has.
4 | **User & Roles** | Displays the users and their roles.
5 | **My user Record** | Opens your "systemuser" record in a new window.
6 | **My Mailbox** | Opens your "mailbox" record in a new window.
7 | **Command Debugger** | Turns on [command checker](https://powerapps.microsoft.com/en-us/blog/introducing-command-checker-for-model-app-ribbons/) for the current Form or View.
8 | **Forms Monitor** | Turns on Forms Monitor. Refer https://powerapps.microsoft.com/en-us/blog/troubleshoot-forms-in-a-model-driven-app/ for more information.
9 | **Entity Metadata** | Displays Object Type Code, Collection Name, Change Tracking and Display Name of all entities

## Impersonating another user

Confirm that you have [Act on Behalf of Another User](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/impersonate-another-user#required-privileges) permission.

### Step 1
Type couple of characters in user's username or fullname.

![Step 1 - Impersonate](/screenshots/impersonate1.png)

### Step 2
If there are any results from the search you can select the user to impersonate

![Step 2 - Impersonate](/screenshots/impersonate2.png)

### Step 3
You can start the impersonation by clicking on the Impersonate button. To stop the impersonation, you can click the Reset button.

![Step 3 - Impersonate](/screenshots/impersonate3.png)

## YouTube Demo (Thank you [Dynamix Academy](https://www.youtube.com/channel/UCIwcIGHhKDM0Te6R2BuZ5_g))
[![YouTube Demo](/screenshots/YouTubeVideoThumbnail.jpg)](https://www.youtube.com/watch?v=oDadS8UPxmE "YouTube")

## Build instructions

	$ npm install
    $ npm build

This will build the solution for Chrome, Firefox and Edge

### Version

Increments version number of `manifest.json` and `package.json`,
commits the change to git and adds a git tag.


    $ gulp patch      // => 0.0.X

or

    $ gulp feature    // => 0.X.0

or

    $ gulp release    // => X.0.0


## Globals

The build tool also defines a variable named `process.env.NODE_ENV` in your scripts. It will be set to `development` unless you use the `--production` option.


**Example:** `./app/background.js`

```javascript
if(process.env.NODE_ENV === 'development'){
  console.log('We are in development mode!');
}
```

## Credits
* [Bob Guidinger's original idea on Impersonation](https://bguidinger.com/blog/user-impersonation-in-unified-interface-apps)
* [Ivan Ficko](https://dynamicsninja.blog/) for PR that added impersonation capability to Level up
* [God mode adapted from original script by Paul Nieuwelaar](https://paulnieuwelaar.wordpress.com/2014/07/30/activate-god-mode-in-crm-2013-dont-let-your-users-see-this/)
* [Customize by Paul Nieuwelaar](https://paulnieuwelaar.wordpress.com/2014/07/28/customize-and-publish-from-crm-2013-forms-with-bookmarklets/)
* [Form Properties by Jared Johnson](http://www.magnetismsolutions.com/blog/jaredjohnson/2014/08/03/dynamics-crm-2013-resurrecting-the-form-properties-window-with-bookmarklet)
* [Minimum values by Ahmed Anwar](http://www.magnetismsolutions.com/blog/ahmed-anwar's-blog/2014/12/8/microsoft-dynamics-crm-2013-populating-required-fields-with-bookmarklets)
* [Display Logical Names adapted from original script by Chris Groh](http://us.hitachi-solutions.com/blog/2014/10/27/showing-entity-logical-names-on-form/)
* [Performance Center by Benjamin John](http://www.leicht-bewoelkt.de/en/dynamics-crm-bookmarklets-v2)
* [Rocket Icon by Jerry Low](https://www.iconfinder.com/jerrylow)
* [Chrome extension kickstart yo generator by HaNdTrix](https://github.com/HaNdTriX/generator-chrome-extension-kickstart)
* [Copy Text to Clipboard by Sindre Sorhus](https://github.com/sindresorhus/copy-text-to-clipboard)
* [Enable/Disable new navigation by Jared Johnson](https://www.magnetismsolutions.com/blog/jaredjohnson/2018/11/27/dynamics-365-v9-1-enable-unified-interface-ui-updates-on-upgraded-organizations)
* [Chrome Extension Yeoman Generator](https://github.com/mazamachi/generator-chrome-extension-kickstart-typescript)
