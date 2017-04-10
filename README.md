# Summary
Chrome Extension for Dynamics CRM Power users

![Level up screenshot](/screenshots/Levelup.png)

# Usage
Install the extension from Chrome Store. https://chrome.google.com/webstore/detail/level-up-for-dynamics-crm/bjnkkhimoaclnddigpphpgkfgeggokam

# Detailed Functionality

Action | What it does
--- | ---
**Logical Names** | Displays logical names for fields, tabs and sections.
**God Mode** | Makes all mandatory fields optional. Makes hidden fields/tabs/sections visible. Makes read-only fields editable.
**Record Properties** | Displays information about current record like Created By, Created On, Modified By, Modified on, Permissions and Owner. 
**Changed Fields** | Highlights fields in the form that have been changed, but not saved yet.
**Record URL** | Displays the current record URL in a dialog. The URL can be copied from the dialog and dismissed.
**Record Id** | Displays the current record Id in a dialog. The Id can be copied from the dialog and dismissed.
**Refresh All subgrids** | Refreshes all the subgrids on the current form. It does not refresh the associated views.
**Minimum values** | This is intended for use on a new record. It fills out minimum values for all required fields. Only the following field types are filled out automatically: Memo, String, Boolean, DateTime, Decimal, Double, Integer, Money and OptionSet.
**Show Optionset values** | Updates all the OptionSet fields on the current form to show text as well the the value of the OptionSet.
**Clone Record** | Use the record parameters functionality and display a new popup which is a clone of the current record. This clone does not include the child records.
**Refresh + Autosave off** | Refreshes the current form without saving it. It also turns off the auto-save after refresh.
**Toggle Tabs** | Collapses or expands the tabs in the form.
**Workflows & Business Rules** | Displays any workflows and business rules for the current entity.
**Copy Lookup** | Copies the lookup field selected on the form
**Paste Lookup** | Paste the copied lookup field
**Lookup in new window** | Opens the selected lookup in a new window/tab
**Customize** | Opens the entity in the default solution. Do not use this solution to add new fields, unless you have changed the default publisher prefix, which is "new_"
**All Fields** | Displays values for all fields not in the current form
**Open record By Id** | Displays a dialog to get the entity schemaname and record id. Once this is given, it opens a new popup to show the record.
**New record** | Displays a dialog to get the entity schemaname. Once this is given, it opens a new popup to create a new record.
**Security** | Displays the security area from the sitemap.
**System Jobs** | Displays the system jobs from the sitemap.
**Solutions** | Displays the solutions area from the sitemap.
**Process** | Displays the processes area from the sitemap.
**Open Main** | Opens the CRM homepage (main.aspx) on a new window.
**Advanced Find** | Opens Advanced Find in a new window.
**Mobile Client** | Opens the mobile client (MoCA) in a new window.
**My user Record** | Opens your "systemuser" record in a new window.
**My Mailbox** | Opens your "mailbox" record in a new window.
**Perf Diag** | Displays the performance diagnostics page. Primarily useful for assessing network performance. Refer https://mbs.microsoft.com/customersource/Global/CRM/learning/documentation/user-guides/PerformanceOptimizationsCRMOnlineSuccess.
**Perf Center** | Displays the performance center page. Primarily used to assess slow form performance. Can be used in conjunction with DevTools. Refer http://blog.cobalt.net/blog/understanding-the-microsoft-dynamics-crm-performance-center
**Instance Picker** | Displays the instance picker page (applicable to Dynamics CRM/365 Online only).
**New window** | Displays the current grid (Saved Query) in a new window.
**Quick Find fields** | Displays the search fields for the current entity that is displayed in the grid.
**Org Settings** | Displays some useful information about the current "Organization" you are connected to in a popup.
**My Roles** | Displays the user roles, that you user record has.

# Functionality
Please watch this animation below for quick functionality intro.

![Power up extension introduction](/screenshots/Functionality Quick Intro.gif "Functionality")

# YouTube Demo (Thank you [@daryllabar](https://github.com/daryllabar))
[![YouTube Demo](/screenshots/YouTubeVideoThumbnail.jpg)](https://youtu.be/zqPGeOH1OF4 "YouTube")

# Credits
* God mode adapted from original script by Paul Nieuwelaar. (https://paulnieuwelaar.wordpress.com/2014/07/30/activate-god-mode-in-crm-2013-dont-let-your-users-see-this/)
* Customize by Paul Nieuwelaar
(https://paulnieuwelaar.wordpress.com/2014/07/28/customize-and-publish-from-crm-2013-forms-with-bookmarklets/)
* Form Properties by Jared Johnson (http://www.magnetismsolutions.com/blog/jaredjohnson/2014/08/03/dynamics-crm-2013-resurrecting-the-form-properties-window-with-bookmarklet)
* Minimum values by Ahmed Anwar (http://www.magnetismsolutions.com/blog/ahmed-anwar's-blog/2014/12/8/microsoft-dynamics-crm-2013-populating-required-fields-with-bookmarklets)
* Display Logical Names adapted from original script by Chris Groh (http://us.hitachi-solutions.com/blog/2014/10/27/showing-entity-logical-names-on-form/)
* Performance Center by Benjamin John (http://www.leicht-bewoelkt.de/en/dynamics-crm-bookmarklets-v2)
* Rocket Icon by Jerry Low - (https://www.iconfinder.com/jerrylow)
