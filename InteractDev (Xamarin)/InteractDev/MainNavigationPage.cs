using System;

using Xamarin.Forms;

namespace InteractDev
{
	public class MainNavigationPage : NavigationPage
	{
		public MainNavigationPage() : base(new MainPage())
		{
			if (!QuantiServer.Authenticated)
				Navigation.PushModalAsync(new NavigationPage(new LoginPage()));
		}
	}
}

