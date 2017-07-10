using System;
using System.Collections.Generic;

using Realms;

using Xamarin.Forms;

namespace InteractDev
{
	public partial class MainPage : ContentPage
	{
		public MainPage()
		{
			InitializeComponent();

			SyncUtils.UpdateLocalTeamMembers().ContinueWith((arg) =>
			{
				System.Diagnostics.Debug.WriteLine("Updated local team member database!");
			});
		}

		protected override void OnAppearing()
		{
			
		}

		public void StartInteraction(object sender, EventArgs e)
		{
			SyncUtils.UpdateLocalTeamMembers().ContinueWith((arg) =>
			{
                Device.BeginInvokeOnMainThread(() => 
                {
					var realm = Realm.GetInstance();

					if (!arg.Result)
					{
						DisplayAlert("Error!", "An error has occurred while acquiring the members of the team you are contained in.\n\nAre you sure you are contained in a team?", "OK");

						return;
					}

					if (realm.All<TeamMember>().AsRealmCollection().Count == 0)
					{
						DisplayAlert("Error!", "The team you are contained in has no other members.", "OK");

						return;
					}

					Navigation.PushAsync(new NewInteractionPage());
                });
			});
		}

		public void ShowLocalHistory(object sender, EventArgs e)
		{
			Navigation.PushAsync(new HistoryPage());
		}

		public void ShowRemoteHistory(object sender, EventArgs e)
		{
			Navigation.PushAsync(new RemoteHistoryPage());
		}

		public void ShowSettings(object sender, EventArgs e)
		{
			Navigation.PushAsync(new SettingsPage());
		}
	}
}
