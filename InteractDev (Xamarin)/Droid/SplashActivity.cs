using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Views;
using Android.Widget;

namespace InteractDev.Droid
{
	[Activity(Label = "Loading...", MainLauncher = true)]
	public class SplashActivity : Activity
	{
		protected override void OnCreate(Bundle savedInstanceState)
		{
			base.OnCreate(savedInstanceState);

			SetContentView(Resource.Layout.Splash);
		}

		protected override void OnResume()
		{
			base.OnResume();

			new Task(() =>
			{
				StartActivity(new Intent(ApplicationContext, typeof(MainActivity)));
			}).Start();
		}
	}
}
