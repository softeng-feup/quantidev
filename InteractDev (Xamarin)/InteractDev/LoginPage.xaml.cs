using System;
using System.Collections.Generic;

using Xamarin.Forms;

namespace InteractDev
{
	public partial class LoginPage : ContentPage
	{

		public LoginPage()
		{
			InitializeComponent();

			LoginCell.Command = new Command(async () =>
			{
				var username = UsernameEntry.Text;
				var password = PasswordEntry.Text;

				var result = await QuantiServer.Login(username, password);

				if (result)
				{
					await Navigation.PopModalAsync();
				}
				else
				{
					await DisplayAlert("Login Failed!", "Please verify the inserted fields and try again.", "OK");
				}
			});

			SignupCell.Command = new Command(() =>
			{
				Device.OpenUri(new Uri(QuantiServer.SignupURL));
			});
		}
	}
}
