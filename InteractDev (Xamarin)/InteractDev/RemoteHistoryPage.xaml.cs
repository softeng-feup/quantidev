using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

using Xamarin.Forms;

namespace InteractDev
{
	public partial class RemoteHistoryPage : ContentPage
	{
		ObservableCollection<RemoteInteractionLog> RemoteLog = new ObservableCollection<RemoteInteractionLog>();

		public RemoteHistoryPage()
		{
			InitializeComponent();

			HistoryListView.ItemsSource = RemoteLog;

			HistoryListView.ItemSelected += (sender, e) =>
			{
				if (e.SelectedItem == null)
					return;

				var il = (RemoteInteractionLog) e.SelectedItem;

				Navigation.PushAsync(new PastSharedInteractionPage(il));

				HistoryListView.SelectedItem = null;
			};

			QuantiServer.GetSharedInteractions().ContinueWith((arg) =>
			{
				foreach (var il in arg.Result) 
				{
					RemoteLog.Add(il);
				}
			});
		}

		protected override void OnAppearing()
		{
			
		}
	}
}
