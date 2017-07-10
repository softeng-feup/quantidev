using System;

using Xamarin.Forms;

namespace InteractDev
{
	public static class LocalSettings
	{
		public static bool AutomaticallyShareNotes
		{
			get
			{
				if (Application.Current.Properties.ContainsKey("settingsShareNotes")) 
					return (bool)(Application.Current.Properties["settingsShareNotes"]);

				return false;
			}

			set
			{
				Application.Current.Properties["settingsShareNotes"] = value;

				Application.Current.SavePropertiesAsync();
			}
		}

		public static void DeleteSavedProperties()
		{
			Application.Current.Properties.Remove("settingsShareNotes");

			Application.Current.SavePropertiesAsync();
		}
	}
}
