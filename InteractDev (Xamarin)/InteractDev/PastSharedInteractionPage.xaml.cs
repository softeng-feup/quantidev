using System;
using System.Collections.Generic;

using Xamarin.Forms;

namespace InteractDev
{
	public partial class PastSharedInteractionPage : ContentPage
	{
		public RemoteInteractionLog Log { get; set; }

		public PastSharedInteractionPage()
		{
			InitializeComponent();
		}

		public PastSharedInteractionPage(RemoteInteractionLog log)
		{
			InitializeComponent();

			Log = log;

			BindingContext = log;
		}
	}
}
