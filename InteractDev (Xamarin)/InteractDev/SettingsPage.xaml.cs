using System;
using System.Collections.Generic;

using Realms;

using Xamarin.Forms;

namespace InteractDev
{
	public partial class SettingsPage : ContentPage
	{
		public bool ShareNotes { get; set; }

		public SettingsPage()
		{
			InitializeComponent();

			ShareNotes = LocalSettings.AutomaticallyShareNotes;

			BindingContext = this;
		}

		private void AutoShareChanged(object sender, EventArgs e)
		{
			ShareNotes = ((SwitchCell) sender).On;

			LocalSettings.AutomaticallyShareNotes = ShareNotes;
		}

		private async void LogOut(object sender, EventArgs e)
		{
			var answer = await DisplayAlert("Log Out", "Are you sure you want to log out from InteractDev?", "Log Out", "Cancel");

			if (answer)
			{
				QuantiServer.DeleteSavedProperties();
				LocalSettings.DeleteSavedProperties();

				var realm = Realm.GetInstance();

				realm.Write(() =>
				{
					realm.RemoveAll();
				});

				await Navigation.PushModalAsync(new NavigationPage(new LoginPage()));
			}
		}
	}
}
