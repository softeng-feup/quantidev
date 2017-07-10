﻿using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.Net;

using Newtonsoft.Json;

using Xamarin.Forms;

namespace InteractDev
{
	public class GenericResponse
	{
		public bool success;	
	}

	public class LoginResponse : GenericResponse
	{
		public string token;
	}

	public class InteractionResponse : GenericResponse
	{
		public List<RemoteInteractionLog> interactions;
	}

	public class MyInteractionResponse : GenericResponse
	{
		public List<RemoteSelfInteractionLog> interactions;	
	}

	public class NewInteractionResponse : GenericResponse
	{
		public string identifier;
	}

	public class RemoteTeamMemberRepresentation
	{
		public string id { get; set; }
		public string name { get; set; }
		public string username { get; set; }
		public string team { get; set; }
	}

	public class RemoteTeamDetails
	{
		public string id { get; set; } 
		public string name { get; set; }
		public string owner { get; set; }
	}

	public class TeamResponse : GenericResponse
	{
		public InnerTeamResponse team;
	}

	public class InnerTeamResponse
	{
		public RemoteTeamDetails details;
		public List<RemoteTeamMemberRepresentation> members;
	}

	public class BaseRemoteInteractionLog
	{
		public string startDate { get; set; }
		public int duration { get; set; }
		public string notes { get; set; }

		public string StartDateRepresentation
		{
			get
			{
				return StartDateOffset.ToString("F");
			}
		}

		public string LengthRepresentation
		{
			get
			{
				return Utilities.SecondsToHMS(duration);
			}
		}

		public DateTimeOffset StartDateOffset
		{
			get
			{
				return DateTimeOffset.Parse(startDate);
			}
		}
	}

	public class RemoteInteractionLog : BaseRemoteInteractionLog
	{
		public RemoteTeamMemberRepresentation owner { get; set; }
	}

	public class RemoteSelfInteractionLog : RemoteInteractionLog
	{
		public RemoteTeamMemberRepresentation intervenient { get; set; }
		public int rating { get; set; }
		public bool shared { get; set; }
		public string identifier { get; set; }
	}

	public static class QuantiServer
	{
		private static string ServerURL = "";
		private static string QuantiWebURL = "";

		private static string BaseURL
		{
			get
			{
				return ServerURL + "api/";
			}
		}

		public static string SignupURL
		{
			get
			{
				return QuantiWebURL + "signup";
			}
		}

		public static string Username
		{
			get
			{
				if (Application.Current.Properties.ContainsKey("username")) 
				{
					return Application.Current.Properties["username"] as string;
				}

				return null;
			}

			private set
			{
				Application.Current.Properties["username"] = value;

				Application.Current.SavePropertiesAsync();
			}
		}

		private static string Token
		{
			get
			{
				if (Application.Current.Properties.ContainsKey("token")) 
				{
					return Application.Current.Properties["token"] as string;
				}

				return null;
			}

			set
			{
				Application.Current.Properties["token"] = value;

				Application.Current.SavePropertiesAsync();
			}
		}

		public static bool Authenticated
		{
			get
			{
				return Token != null;
			}
		}

		private static String AuthorizationHeader
		{
			get
			{
				if (Username != null && Token != null)
					return "QD-TOKEN " + Username + ";" + Token;

				return null;
			}
		}

		public static void DeleteSavedProperties()
		{
			Application.Current.Properties.Remove("username");
			Application.Current.Properties.Remove("token");

			Application.Current.SavePropertiesAsync();
		}

		private static string BuildURI(string route)
		{
			return BaseURL + route;
		}

		public static async Task<bool> Login(string username, string password)
		{
            try 
            {
				using (HttpClient httpClient = new HttpClient())
				{
					var url = new Uri(BuildURI("login") +
									  "?username=" + WebUtility.UrlEncode(username) +
									  "&password=" + WebUtility.UrlEncode(password));

					var response = await httpClient.GetAsync(url).ConfigureAwait(false);

					if (response.StatusCode == HttpStatusCode.OK)
					{
						var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

						LoginResponse r = JsonConvert.DeserializeObject<LoginResponse>(content);

						if (!r.success)
							return false;

						Username = username;
						Token = r.token;

						await Application.Current.SavePropertiesAsync().ConfigureAwait(false);

						return true;
					}
					else
						System.Diagnostics.Debug.WriteLine("Code: " + response.StatusCode);
				}
            }
            catch
            {
                
            }

            return false;
		}

		public static async Task<List<RemoteTeamMemberRepresentation>> GetTeamMembers()
		{
            try {
				using (HttpClient httpClient = new HttpClient())
				{
					var request = new HttpRequestMessage()
					{
						RequestUri = new Uri(BuildURI("team")),
						Method = HttpMethod.Get
					};

					httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", AuthorizationHeader);

					var response = await httpClient.SendAsync(request).ConfigureAwait(false);

					if (response.StatusCode == HttpStatusCode.OK)
					{
						var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

						TeamResponse r = JsonConvert.DeserializeObject<TeamResponse>(content);

						return r.team.members;
					}
				}
            }
            catch
            {
                
            }

            return null;
		}

		public static async Task<string> PublishInteractionResult(InteractionLog log)
		{
            try
            {
				using (HttpClient httpClient = new HttpClient())
				{
					httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", AuthorizationHeader);

					var url = new Uri(BuildURI("log"));

					var content = new FormUrlEncodedContent(new[] {
					    new KeyValuePair<string, string>("class", "interaction"),
						new KeyValuePair<string, string>("intervenient", log.Member.Identifier),
						new KeyValuePair<string, string>("rating", "" + log.Rating),
						new KeyValuePair<string, string>("duration", "" + log.ElapsedTime),
						new KeyValuePair<string, string>("notes", log.Note),
						new KeyValuePair<string, string>("shared", "" + (log.Shared ? 1 : 0))
				    });

					var response = await httpClient.PostAsync(url, content).ConfigureAwait(false);

					if (response.StatusCode == HttpStatusCode.OK)
					{
						var c = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

						NewInteractionResponse r = JsonConvert.DeserializeObject<NewInteractionResponse>(c);

						return r.identifier;
					}
					else
						System.Diagnostics.Debug.WriteLine("Code: " + response.StatusCode);
				}
            }
            catch
            {
                
            }

            return null;
		}

		public static async Task<List<RemoteInteractionLog>> GetSharedInteractions()
		{
            try 
            {
				using (HttpClient httpClient = new HttpClient())
				{
					httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", AuthorizationHeader);

					var url = new Uri(BuildURI("interact/shared"));

					var response = await httpClient.GetAsync(url).ConfigureAwait(false);

					if (response.StatusCode == HttpStatusCode.OK)
					{
						var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

						InteractionResponse r = JsonConvert.DeserializeObject<InteractionResponse>(content);

						return r.interactions;
					}
				}   
            } 
            catch 
            {
                
            }

            return null;
		}

		public static async Task<bool> UpdateInteractionPrivacy(InteractionLog il)
		{
            try 
            {
				using (HttpClient httpClient = new HttpClient())
				{
					httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", AuthorizationHeader);

					var url = new Uri(BuildURI("interact/" + il.RemoteIdentifier));

					var content = new FormUrlEncodedContent(new[] {
					    new KeyValuePair<string, string>("shared", "" + (il.Shared ? 1 : 0))
				    });

					var response = await httpClient.PostAsync(url, content).ConfigureAwait(false);

					if (response.StatusCode == HttpStatusCode.OK)
					{
						var c = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

						GenericResponse r = JsonConvert.DeserializeObject<GenericResponse>(c);

						return r.success;
					}
					else
						System.Diagnostics.Debug.WriteLine("Code: " + response.StatusCode);
				}
            }
            catch
            {
                
            }

			return false;
		}

		public static async Task<bool> DeleteInteractionNotes(InteractionLog il)
		{
            try 
            {
				using (HttpClient httpClient = new HttpClient())
				{
					httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", AuthorizationHeader);

					var url = new Uri(BuildURI("interact/" + il.RemoteIdentifier));

					var response = await httpClient.DeleteAsync(url).ConfigureAwait(false);

					if (response.StatusCode == HttpStatusCode.OK)
					{
						var c = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

						GenericResponse r = JsonConvert.DeserializeObject<GenericResponse>(c);

						return r.success;
					}
					else
						System.Diagnostics.Debug.WriteLine("Code: " + response.StatusCode);
				}
            }
            catch
            {
                
            }

			return false;
		}

		public static async Task<List<RemoteSelfInteractionLog>> DownloadInteractionNotes()
		{
            try 
            {
				using (HttpClient httpClient = new HttpClient())
				{
					httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", AuthorizationHeader);

					var url = new Uri(BuildURI("interact/my"));

					var response = await httpClient.GetAsync(url).ConfigureAwait(false);

					if (response.StatusCode == HttpStatusCode.OK)
					{
						var c = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

						MyInteractionResponse r = JsonConvert.DeserializeObject<MyInteractionResponse>(c);

						if (r.success)
							return r.interactions;
					}
					else
						System.Diagnostics.Debug.WriteLine("Code: " + response.StatusCode);
				}
            }
            catch
            {
                
            }

			return null;
		}
	}
}
