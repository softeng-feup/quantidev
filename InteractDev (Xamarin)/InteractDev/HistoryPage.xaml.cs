using System;
using System.Linq;
using System.Collections.Generic;

using Realms;

using Xamarin.Forms;

namespace InteractDev
{
	public partial class HistoryPage : ContentPage
	{
		Realm LocalRealm = Realm.GetInstance();

		public HistoryPage()
		{
			InitializeComponent();

			SyncUtils.UpdateLocalInteractionNotes().ContinueWith((arg) =>
			{
				Device.BeginInvokeOnMainThread(() =>
				{
					var interactions = LocalRealm.All<InteractionLog>().OrderByDescending(il => il.Date);

					HistoryListView.ItemsSource = interactions;

					HistoryListView.ItemSelected += (sender, e) =>
					{
						if (e.SelectedItem == null)
							return;

						var il = (InteractionLog)e.SelectedItem;

						Navigation.PushAsync(new PastInteractionPage(il));

						HistoryListView.SelectedItem = null;
					};
				});
			});
		}

		protected override void OnAppearing()
		{
			
		}
	}
}
