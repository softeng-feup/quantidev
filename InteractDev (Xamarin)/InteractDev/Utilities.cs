using System;
namespace InteractDev
{
	public static class Utilities
	{
		public static string SecondsToHMS(int input)
		{
			var seconds = (int)(input % 60);
			var minutes = (int)(input / 60);
			var hours = (int)(minutes / 60);

			minutes = (int)(minutes % 60);

			return "" + (hours >= 10 ? "" + hours : "0" + hours) +
				":" + (minutes >= 10 ? "" + minutes : "0" + minutes) +
				":" + (seconds >= 10 ? "" + seconds : "0" + seconds);
		}
	}
}
