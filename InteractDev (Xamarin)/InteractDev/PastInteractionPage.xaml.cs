using System;
using System.Collections.Generic;

using Xamarin.Forms;

using Realms;

namespace InteractDev
{
	public partial class PastInteractionPage : ContentPage
	{
		public InteractionLog Log { get; set; }

		public PastInteractionPage()
		{
			InitializeComponent();
		}

		public PastInteractionPage(InteractionLog log)
		{
			InitializeComponent();

			Log = log;

			BindingContext = log;
		}

		public void ToggleShare(object sender, EventArgs e)
		{
			QuantiServer.UpdateInteractionPrivacy(Log).ContinueWith((arg) => { });
		}

		public async void DeleteInteraction(object sender, EventArgs e)
		{
			System.Diagnostics.Debug.WriteLine("Tapped delete interaction!");

			var answer = await DisplayAlert("Delete Interaction", "Are you sure you want to delete the current interaction?", "Delete", "Cancel");

			if (answer)
			{
				await QuantiServer.DeleteInteractionNotes(Log);

				using (var realm = Realm.GetInstance())
				{
					realm.Write(() =>
					{
						realm.Remove(Log);
					});
				}

				await Navigation.PopAsync();
			}
		}
	}
}
